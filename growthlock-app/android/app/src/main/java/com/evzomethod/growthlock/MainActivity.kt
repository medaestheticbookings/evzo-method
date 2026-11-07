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

    private val teal = Color.parseColor("#3FB8C4")
    private val card = Color.parseColor("#18212A")
    private val bg = Color.parseColor("#0F1419")
    private val ok = Color.parseColor("#6FC08C")

    private var web: WebView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        draw()
    }

    override fun onResume() {
        super.onResume()
        if (ready() && web == null) draw()
    }

    private fun ready() = Watcher.hasUsageAccess(this) && Watcher.hasOverlay(this)

    private fun draw() {
        if (ready()) showApp() else showSetup()
    }

    /* ---------- the whole app ---------- */

    @SuppressLint("SetJavaScriptEnabled")
    private fun showApp() {
        val w = WebView(this)
        w.setBackgroundColor(bg)
        w.settings.javaScriptEnabled = true
        w.settings.domStorageEnabled = true
        w.settings.mediaPlaybackRequiresUserGesture = false
        w.webChromeClient = WebChromeClient()
        w.webViewClient = WebViewClient()
        w.addJavascriptInterface(Bridge(this), "GrowthLockNative")
        w.loadUrl("file:///android_asset/index.html")
        web = w
        setContentView(w)
    }

    override fun onBackPressed() {
        val w = web
        if (w != null && w.canGoBack()) w.goBack() else super.onBackPressed()
    }

    /* ---------- first run ---------- */

    private fun showSetup() {
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
            setTextColor(Color.parseColor("#E4EDF3"))
            setPadding(0, 0, 0, 14)
        })
        root.addView(TextView(this).apply {
            text = "Two switches, once. Then the app blocks for real."
            textSize = 16f
            setTextColor(Color.parseColor("#8B9BA8"))
        })

        root.addView(step(1, "See which app is open", Watcher.hasUsageAccess(this)) {
            Watcher.askUsageAccess(this)
        })
        root.addView(hint(root, "Find GrowthLock in the list and switch it on."))

        root.addView(step(2, "Show the block screen", Watcher.hasOverlay(this)) {
            Watcher.askOverlay(this)
        })
        root.addView(hint(root, "Allow GrowthLock to display over other apps."))

        root.addView(hint(root, "Neither switch can read your screen, your typing or your passwords. The app has no internet permission, so nothing can leave this phone."))
        setContentView(scroll)
    }

    private fun step(n: Int, label: String, done: Boolean, f: () -> Unit) = Button(this).apply {
        text = if (done) "$n. $label  -  on" else "$n. $label"
        textSize = 16f
        isAllCaps = false
        setTextColor(if (done) ok else Color.parseColor("#05171A"))
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
        setTextColor(Color.parseColor("#5C6B7A"))
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
    }
}
