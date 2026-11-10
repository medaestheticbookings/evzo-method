package com.evzomethod.mentor

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader

/**
 * The whole app: one WebView showing the mentor page that is bundled into the
 * APK under assets/.
 *
 * Two decisions worth knowing about.
 *
 * The page is served through WebViewAssetLoader, so it loads from
 * https://appassets.androidplatform.net/assets/... rather than file://. Only
 * the first gives the page a real origin, and without a real origin localStorage
 * is unreliable between launches on some WebView builds - which would mean
 * losing every figure typed into the three workspaces. The loader also refuses
 * anything outside assets/, so a stray path cannot reach the filesystem.
 *
 * The app holds no INTERNET permission, so any request the page made to the
 * network would simply fail. It makes none: the fonts are bundled beside it.
 */
class MainActivity : Activity() {

    private var web: WebView? = null

    private val loader: WebViewAssetLoader by lazy {
        WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val w = WebView(this)
        w.setBackgroundColor(Color.parseColor("#0B1220"))

        w.settings.javaScriptEnabled = true          // the workspaces are all JS
        w.settings.domStorageEnabled = true          // this is where the data lives
        w.settings.setSupportZoom(false)
        w.settings.builtInZoomControls = false
        w.settings.allowFileAccess = false           // the loader serves assets instead
        w.settings.allowContentAccess = false
        w.settings.cacheMode = android.webkit.WebSettings.LOAD_NO_CACHE
        w.settings.textZoom = 100                    // ignore the system font scale,
                                                     // the layout is already tuned
        w.isVerticalScrollBarEnabled = true
        w.overScrollMode = View.OVER_SCROLL_NEVER

        w.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? = loader.shouldInterceptRequest(request.url)

            /** Nothing in this app should ever navigate off the bundled page. */
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val u = request.url
                return !(u.host == "appassets.androidplatform.net")
            }
        }

        w.loadUrl("https://appassets.androidplatform.net/assets/mentor/index.html")

        web = w
        setContentView(w)
    }

    /** Back walks the page's own history (the section links) before leaving. */
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
