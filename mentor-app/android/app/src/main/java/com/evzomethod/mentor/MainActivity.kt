package com.evzomethod.mentor

import android.annotation.SuppressLint
import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.MotionEvent
import android.view.View
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest

/**
 * The whole app: one WebView showing the mentor page.
 *
 * Where the page comes from
 * -------------------------
 * A copy is bundled in the APK under assets/, so a fresh install works before
 * it has ever seen a network. On every launch the app also asks the website
 * for the current lock screen and the current sealed page, and writes them to
 * its private files directory. From then on the downloaded copy is the one
 * that gets served - which is what makes "we changed something" arrive on the
 * phone without reinstalling anything.
 *
 * It is served through WebViewAssetLoader either way, so it loads from
 * https://appassets.androidplatform.net/assets/... rather than file://. Only
 * the first gives the page a real origin, and without a real origin
 * localStorage is unreliable between launches on some WebView builds - which
 * would mean losing every figure typed into the app.
 *
 * What the INTERNET permission is for, and what it is not for
 * -----------------------------------------------------------
 * Two GET requests to evzomethod.com, for files that are public anyway, plus
 * one small version file. Nothing is ever uploaded: the page has no network
 * code of its own, and the sealed file it decrypts is opened locally with a
 * passphrase this app never sees and never sends. Everything typed into the
 * app stays in this WebView's local storage, exactly as before.
 */
class MainActivity : Activity() {

    private companion object {
        const val SITE = "https://evzomethod.com"
        /**
         * Only the sealed content updates itself. The lock screen - the one
         * file that ever touches the passphrase - stays the signed copy inside
         * the APK and is never replaced from the network.
         *
         * That is the whole security argument for letting this app online:
         * app.enc is AES-GCM, so a file swapped by anyone who got at the site,
         * the DNS or the connection fails its authentication tag and is
         * discarded. There is no path by which a downloaded file becomes code
         * that runs with the passphrase in front of it.
         */
        const val SEALED = "mentor/app.enc"
        const val TIMEOUT = 12_000
    }

    private var web: WebView? = null

    /** Set the moment the screen is touched. An update that lands before the
     *  first touch can refresh the page under him; after it, it waits for the
     *  next launch rather than yanking a half-typed answer off the screen. */
    @Volatile private var touched = false

    /** Where downloaded copies live: filesDir/web/mentor/... */
    private val webDir: File by lazy { File(filesDir, "web") }

    private val loader: WebViewAssetLoader by lazy {
        WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", UpdatablePathHandler())
            .build()
    }

    /**
     * Serves the downloaded copy of a file when there is one, and the copy
     * baked into the APK otherwise. It refuses anything that tries to climb
     * out of the directory.
     */
    private inner class UpdatablePathHandler : WebViewAssetLoader.PathHandler {
        private val assets = WebViewAssetLoader.AssetsPathHandler(this@MainActivity)

        override fun handle(path: String): WebResourceResponse? {
            if (path.contains("..")) return null
            val local = File(webDir, path)
            if (local.isFile && local.canonicalPath.startsWith(webDir.canonicalPath)) {
                try {
                    return WebResourceResponse(mime(path), null, local.inputStream())
                } catch (e: Exception) {
                    // fall through to the bundled copy rather than showing nothing
                }
            }
            return assets.handle(path)
        }

        private fun mime(path: String) = when {
            path.endsWith(".html") -> "text/html"
            path.endsWith(".css") -> "text/css"
            path.endsWith(".js") -> "application/javascript"
            path.endsWith(".woff2") -> "font/woff2"
            path.endsWith(".png") -> "image/png"
            path.endsWith(".svg") -> "image/svg+xml"
            else -> "application/octet-stream"   // app.enc is read as text by the page
        }
    }

    @SuppressLint("SetJavaScriptEnabled", "ClickableViewAccessibility")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val w = WebView(this)
        w.setBackgroundColor(Color.parseColor("#0B1220"))

        w.settings.javaScriptEnabled = true          // the whole app is JS
        w.settings.domStorageEnabled = true          // this is where the data lives
        w.settings.setSupportZoom(false)
        w.settings.builtInZoomControls = false
        w.settings.allowFileAccess = false           // the loader serves files instead
        w.settings.allowContentAccess = false
        w.settings.cacheMode = android.webkit.WebSettings.LOAD_NO_CACHE
        w.settings.textZoom = 100                    // ignore the system font scale,
                                                     // the layout is already tuned
        w.isVerticalScrollBarEnabled = true
        w.overScrollMode = View.OVER_SCROLL_NEVER

        w.setOnTouchListener { _: View, _: MotionEvent -> touched = true; false }

        w.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? = loader.shouldInterceptRequest(request.url)

            /** Nothing inside the app navigates off the page; a real link opens
             *  in the browser instead of replacing the app with a web page. */
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val u = request.url
                if (u.host == "appassets.androidplatform.net") return false
                try {
                    startActivity(Intent(Intent.ACTION_VIEW, u))
                } catch (e: Exception) {
                    // no browser to take it; staying put is the right failure
                }
                return true
            }
        }

        w.loadUrl("https://appassets.androidplatform.net/assets/mentor/index.html")

        web = w
        setContentView(w)

        Thread { syncPage() }.start()
    }

    /**
     * Pull the current page files. Each is written only if it actually differs,
     * so an unchanged build costs two requests and no disk writes. A download
     * goes to a .part file first and is renamed when it is complete, so a
     * connection that dies halfway can never leave a truncated page behind.
     */
    private fun syncPage() {
        try {
            val bytes = get("$SITE/$SEALED")
            if (bytes != null && looksSealed(bytes)) {
                val out = File(webDir, SEALED)
                if (!out.isFile || sha(out.readBytes()) != sha(bytes)) {
                    out.parentFile?.mkdirs()
                    val part = File(out.parentFile, out.name + ".part")
                    part.writeBytes(bytes)
                    if (part.renameTo(out) && !touched) {
                        runOnUiThread { if (!touched) web?.reload() }
                    }
                }
            }
        } catch (e: Exception) {
            // offline, or the site is down: the bundled copy still works
        }
        checkAppVersion()
    }

    /**
     * A cheap sanity check before anything replaces the file on disk: the real
     * article is a small JSON object carrying the salt, the nonce and the
     * ciphertext. A captive-portal login page or a 404 body fails here and is
     * thrown away. It is not a security check - the GCM tag inside the page is
     * what actually decides - it only keeps a junk download from replacing a
     * good file.
     */
    private fun looksSealed(b: ByteArray): Boolean {
        if (b.size < 1024) return false
        return try {
            val o = JSONObject(String(b, Charsets.UTF_8))
            o.has("ct") && o.has("iv") && o.has("salt")
        } catch (e: Exception) {
            false
        }
    }

    /**
     * The page updates itself; the Kotlin around it cannot. When the site
     * reports a newer build than this one, say so once and offer the download.
     * Everything stays installed and every figure stays where it is - Android
     * installs the new APK over this one, because both are signed with the
     * same key.
     */
    private fun checkAppVersion() {
        try {
            val body = get("$SITE/mentor-version.json") ?: return
            val latest = JSONObject(String(body)).optInt("build", 0)
            val mine = packageManager.getPackageInfo(packageName, 0).versionCode
            if (latest <= mine) return
            runOnUiThread {
                if (isFinishing) return@runOnUiThread
                AlertDialog.Builder(this)
                    .setTitle("Νέα έκδοση · New version")
                    .setMessage("Η εφαρμογή έχει ενημέρωση. Τα δεδομένα σου μένουν όπως είναι.\n\n" +
                                "There is an app update. Your data stays as it is.")
                    .setPositiveButton("Λήψη · Download") { _, _ ->
                        try {
                            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("$SITE/mentor.apk")))
                        } catch (e: Exception) {
                        }
                    }
                    .setNegativeButton("Αργότερα · Later", null)
                    .show()
            }
        } catch (e: Exception) {
            // a missing or malformed version file is not worth bothering him with
        }
    }

    private fun get(url: String): ByteArray? {
        var c: HttpURLConnection? = null
        return try {
            c = URL(url).openConnection() as HttpURLConnection
            c.connectTimeout = TIMEOUT
            c.readTimeout = TIMEOUT
            c.instanceFollowRedirects = true
            c.setRequestProperty("Cache-Control", "no-cache")
            if (c.responseCode != 200) null else c.inputStream.use { it.readBytes() }
        } catch (e: Exception) {
            null
        } finally {
            c?.disconnect()
        }
    }

    private fun sha(b: ByteArray): String =
        MessageDigest.getInstance("SHA-256").digest(b).joinToString("") { "%02x".format(it) }

    /** Back walks the page's own history before leaving the app. */
    override fun onBackPressed() {
        val w = web
        if (w != null && w.canGoBack()) w.goBack() else super.onBackPressed()
    }

    /** The page writes to localStorage on every keystroke and WebView persists
     *  it itself, so there is nothing to flush here on the way out. */
    override fun onDestroy() {
        web?.destroy()
        web = null
        super.onDestroy()
    }
}
