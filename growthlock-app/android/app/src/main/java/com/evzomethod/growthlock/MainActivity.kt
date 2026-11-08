package com.evzomethod.growthlock

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

/**
 * The app is the full GrowthLock - monsters, quests, world, stats - running
 * from the bundled page, with the native blocker underneath it. The page calls
 * into [Bridge] when a block starts or ends, and the service does the part a
 * browser can never do.
 *
 * The only native screen is the first-run one, because Android will not let a
 * page ask for these two switches.
 */
class MainActivity : Activity() {

    private val REQ_LOCATION = 71

    private val teal = Color.parseColor("#FFE14D")
    private val card = Color.parseColor("#141C2C")
    private val bg = Color.parseColor("#0B1220")
    private val ok = Color.parseColor("#9FE870")

    private var web: WebView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        draw()
    }

    override fun onResume() {
        super.onResume()
        // coming back from a system settings screen: if both switches are on now,
        // go straight back into the app rather than sitting on the setup screen
        if (web == null && ready()) draw()
    }

    private fun ready() = Watcher.hasUsageAccess(this) && Watcher.hasOverlay(this)

    /**
     * The chooser opens first, always. Blocking permissions are asked for only
     * when someone actually starts a block in Renew - the other two experiences
     * never need them.
     */
    private fun draw() = showApp()

    /* ---------- the whole app ---------- */

    @SuppressLint("SetJavaScriptEnabled")
    private fun showApp() {
        val w = WebView(this)
        w.setBackgroundColor(bg)
        w.settings.javaScriptEnabled = true
        w.settings.domStorageEnabled = true
        w.settings.mediaPlaybackRequiresUserGesture = false
        w.settings.allowFileAccess = true
        // Uncover is a walking game: it is nothing without the map and the
        // person's position, so the WebView has to pass that request on rather
        // than silently refusing it, which is why the map came up empty.
        w.settings.setGeolocationEnabled(true)
        w.settings.setSupportZoom(false)
        w.settings.cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
        w.webChromeClient = object : WebChromeClient() {
            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: android.webkit.GeolocationPermissions.Callback?
            ) {
                if (origin == null || callback == null) return
                if (hasLocation()) {
                    callback.invoke(origin, true, true)
                } else {
                    pendingGeo = Pair(origin, callback)
                    requestPermissions(
                        arrayOf(
                            android.Manifest.permission.ACCESS_FINE_LOCATION,
                            android.Manifest.permission.ACCESS_COARSE_LOCATION
                        ),
                        REQ_LOCATION
                    )
                }
            }
        }
        w.webViewClient = WebViewClient()
        w.addJavascriptInterface(Bridge(this), "GrowthLockNative")
        w.loadUrl(PageUpdater.pageUrl(this))
        // pick up anything new for next launch, quietly
        PageUpdater.refresh(this)
        web = w
        setContentView(w)
    }

    private var pendingGeo: Pair<String, android.webkit.GeolocationPermissions.Callback>? = null

    private fun hasLocation() = checkSelfPermission(
        android.Manifest.permission.ACCESS_FINE_LOCATION
    ) == android.content.pm.PackageManager.PERMISSION_GRANTED

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != REQ_LOCATION) return
        val granted = grantResults.isNotEmpty() &&
            grantResults[0] == android.content.pm.PackageManager.PERMISSION_GRANTED
        pendingGeo?.let { (origin, cb) -> cb.invoke(origin, granted, true) }
        pendingGeo = null
    }

    override fun onBackPressed() {
        val w = web ?: return super.onBackPressed()
        val url = w.url ?: ""
        when {
            // out in one of the websites: back returns to the chooser, not out of the app
            !url.startsWith("file://") && !w.canGoBack() ->
                w.loadUrl(PageUpdater.pageUrl(this) + "#hub")
            w.canGoBack() -> w.goBack()
            else -> super.onBackPressed()
        }
    }

    /* ---------- first run ---------- */

    fun showSetup() {
        web = null
        val scroll = ScrollView(this).apply { setBackgroundColor(bg) }
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 96, 48, 60)
        }
        scroll.addView(root)

        root.addView(TextView(this).apply {
            text = "GrowthLock"
            textSize = 32f
            setTextColor(Color.parseColor("#FFFFFF"))
            setPadding(0, 0, 0, 14)
        })
        root.addView(TextView(this).apply {
            text = "Two switches, once. Then the app blocks for real."
            textSize = 16f
            setTextColor(Color.parseColor("#7A849A"))
        })

        root.addView(step(1, "See which app is open", Watcher.hasUsageAccess(this)) {
            Watcher.askUsageAccess(this)
        })
        root.addView(hint(root, "Find GrowthLock in the list and switch it on."))

        root.addView(step(2, "Show the block screen", Watcher.hasOverlay(this)) {
            Watcher.askOverlay(this)
        })
        root.addView(hint(root, "Allow GrowthLock to display over other apps."))

        root.addView(hint(root, "Neither switch can read your screen, your typing or your passwords. Only Renew uses them, and only while a block runs."))
        root.addView(Button(this).apply {
            text = "Back"
            isAllCaps = false
            setTextColor(Color.parseColor("#7A849A"))
            background = GradientDrawable().apply { cornerRadius = 26f; setColor(Color.TRANSPARENT); setStroke(2, Color.parseColor("#26324A")) }
            setPadding(0, 28, 0, 28)
            setOnClickListener { web = null; draw() }
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { topMargin = 26 }
        })
        setContentView(scroll)
    }

    private fun step(n: Int, label: String, done: Boolean, f: () -> Unit) = Button(this).apply {
        text = if (done) "$n. $label  -  on" else "$n. $label"
        textSize = 16f
        isAllCaps = false
        setTextColor(if (done) ok else Color.parseColor("#06101B"))
        background = GradientDrawable().apply {
            cornerRadius = 26f
            setColor(if (done) card else teal)
        }
        setPadding(0, 34, 0, 34)
        setOnClickListener { if (!done) f() }
        layoutParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = 18 }
    }

    private fun hint(parent: LinearLayout, s: String) = TextView(this).apply {
        text = s
        textSize = 13f
        setTextColor(Color.parseColor("#5C6478"))
        setPadding(6, 8, 0, 6)
    }

    /** What the page can call. Nothing here reads or returns personal data. */
    class Bridge(private val a: Activity) {

        @JavascriptInterface
        fun isNative(): Boolean = true

        /** The page starts a block; the service starts enforcing it. */
        @JavascriptInterface
        fun startBlock(minutes: Int, label: String) {
            SessionStore.startSession(a, minutes, false, label)
            LockService.start(a)
        }

        @JavascriptInterface
        fun endBlock() {
            SessionStore.endSession(a)
            LockService.stop(a)
        }

        @JavascriptInterface
        fun isBlocking(): Boolean = SessionStore.isActive(a)

        /** true = everything but calls, false = only the chosen apps */
        @JavascriptInterface
        fun setBlockEverything(all: Boolean) = SessionStore.setBlockEverything(a, all)

        @JavascriptInterface
        fun blockEverything(): Boolean = SessionStore.blockEverything(a)

        /** Can we actually block yet? Renew asks this before a block starts. */
        @JavascriptInterface
        fun permissionsReady(): Boolean =
            Watcher.hasUsageAccess(a) && Watcher.hasOverlay(a)

        /** Show the two-switch screen, only once someone wants blocking. */
        @JavascriptInterface
        fun requestPermissions() {
            a.runOnUiThread { (a as MainActivity).showSetup() }
        }

        /** Is there a newer build of the app itself? */
        @JavascriptInterface
        fun updateAvailable(): Boolean = Updater.available

        /** Fetch it and hand it to Android's installer, which asks first. */
        @JavascriptInterface
        fun installUpdate() = Updater.download(a) { }

        /** Minutes the phone lay untouched last night. 0 when we cannot tell. */
        @JavascriptInterface
        fun lastNightPhoneFree(): Int = try { Watcher.lastNightPhoneFree(a) } catch (e: Exception) { 0 }
    }
}
