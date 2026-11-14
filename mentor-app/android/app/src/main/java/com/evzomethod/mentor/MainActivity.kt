package com.evzomethod.mentor

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast

/**
 * The whole app: an icon that opens the mentor.
 *
 * The mentor itself is a private Claude artifact - it has real AI in it, which
 * means it cannot run offline and cannot be bundled into an APK. So this app
 * does the one thing an APK can still do better than a bookmark: it puts a
 * real launcher icon on the phone, and it keeps the daily reminders, which a
 * web page cannot post.
 *
 * It opens the page in the phone's own browser rather than a WebView inside
 * the app. That is deliberate: the sign-in is Claude's, the browser already
 * holds that session, and an embedded WebView would ask him to log in again -
 * and Google refuses sign-in inside WebViews anyway.
 *
 * The activity closes itself immediately, so pressing back from the browser
 * lands where he started instead of on an empty screen.
 */
class MainActivity : Activity() {

    private companion object {
        const val MENTOR = "https://claude.ai/artifact/BrqDnxyViXsjwe1FUkqjpZ"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        Reminders.scheduleAll(this)
        askForNotifications()

        try {
            startActivity(
                Intent(Intent.ACTION_VIEW, Uri.parse(MENTOR))
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(this, "No browser found", Toast.LENGTH_LONG).show()
        }

        finish()
    }

    /**
     * Android 13 and up will not post a notification until the app has asked.
     * Asked once; a refusal is remembered by the system, and the app behaves
     * identically either way - it just stays quiet.
     */
    private fun askForNotifications() {
        if (android.os.Build.VERSION.SDK_INT < 33) return
        val granted = checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) ==
            android.content.pm.PackageManager.PERMISSION_GRANTED
        if (!granted) {
            try {
                requestPermissions(arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 1)
            } catch (e: Exception) {
            }
        }
    }
}
