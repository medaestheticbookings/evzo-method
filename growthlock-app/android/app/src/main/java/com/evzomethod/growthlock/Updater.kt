package com.evzomethod.growthlock

import android.app.Activity
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * Updates the app itself, so a new version never means going back to the
 * website. The pages already refresh on their own; this is for the rare build
 * where the native part changes.
 *
 * It only ever reads one small file from evzomethod.com and, if the number
 * there is higher than this build, downloads the APK and hands it to Android's
 * own installer - which still asks the person to confirm. Nothing installs
 * silently.
 */
object Updater {

    private const val VERSION_URL = "https://evzomethod.com/version.json"
    private const val APK_URL = "https://evzomethod.com/evzo.apk"

    @Volatile var available = false
        private set

    private fun installedVersion(a: Activity): Int = try {
        a.packageManager.getPackageInfo(a.packageName, 0).longVersionCode.toInt()
    } catch (e: Exception) { 0 }

    /** Quiet check on launch; never blocks anything. */
    fun check(a: Activity) {
        Thread {
            try {
                val conn = (URL(VERSION_URL).openConnection() as HttpURLConnection).apply {
                    connectTimeout = 6000; readTimeout = 8000
                }
                if (conn.responseCode == 200) {
                    val body = conn.inputStream.bufferedReader().use { it.readText() }
                    val latest = Regex("\"versionCode\"\\s*:\\s*(\\d+)")
                        .find(body)?.groupValues?.get(1)?.toIntOrNull() ?: 0
                    available = latest > installedVersion(a)
                }
                conn.disconnect()
            } catch (e: Exception) {
                available = false
            }
        }.start()
    }

    /** Download, then let Android's installer take over. */
    fun download(a: Activity, onFail: () -> Unit) {
        Thread {
            try {
                val out = File(a.cacheDir, "evzo-update.apk")
                val conn = (URL(APK_URL).openConnection() as HttpURLConnection).apply {
                    connectTimeout = 10000; readTimeout = 60000
                }
                if (conn.responseCode != 200) throw IllegalStateException("http ${conn.responseCode}")
                conn.inputStream.use { input ->
                    java.io.FileOutputStream(out).use { file -> input.copyTo(file) }
                }
                conn.disconnect()
                if (out.length() < 20000) throw IllegalStateException("too small")

                val uri: Uri = FileProvider.getUriForFile(a, a.packageName + ".files", out)
                val i = Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(uri, "application/vnd.android.package-archive")
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                a.runOnUiThread { a.startActivity(i) }
            } catch (e: Exception) {
                a.runOnUiThread(onFail)
            }
        }.start()
    }
}
