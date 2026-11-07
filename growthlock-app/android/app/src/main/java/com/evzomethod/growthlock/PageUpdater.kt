package com.evzomethod.growthlock

import android.content.Context
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * Keeps the app's own screens up to date without a reinstall.
 *
 * The APK ships a copy of the page. On every launch the app quietly fetches the
 * current one from evzomethod.com and saves it for next time, so new features
 * arrive by themselves. If there is no signal, or the fetch fails, the copy
 * already on the phone is used and nothing changes.
 *
 * Both copies are loaded over file://, which is the same origin, so progress
 * saved by the page survives every update.
 */
object PageUpdater {

    private const val URL_LATEST = "https://evzomethod.com/growthlock/index.html"
    private const val FILE = "app.html"

    /** The newest page we hold: the downloaded one, or the one inside the APK. */
    fun pageUrl(c: Context): String {
        val f = File(c.filesDir, FILE)
        return if (f.exists() && f.length() > 2000) "file://" + f.absolutePath
        else "file:///android_asset/index.html"
    }

    /** Fetch in the background; whatever happens, the app keeps working. */
    fun refresh(c: Context) {
        Thread {
            try {
                val conn = (URL(URL_LATEST).openConnection() as HttpURLConnection).apply {
                    connectTimeout = 8000
                    readTimeout = 12000
                    requestMethod = "GET"
                }
                if (conn.responseCode == 200) {
                    val body = conn.inputStream.bufferedReader().use { it.readText() }
                    if (body.length > 2000 && body.contains("GrowthLock")) {
                        val f = File(c.filesDir, FILE)
                        if (!f.exists() || f.readText() != body) f.writeText(body)
                    }
                }
                conn.disconnect()
            } catch (e: Exception) {
                // offline, or the site is down: keep the copy we already have
            }
        }.start()
    }
}
