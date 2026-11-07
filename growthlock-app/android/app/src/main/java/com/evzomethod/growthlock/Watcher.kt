package com.evzomethod.growthlock

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings

/**
 * Blocking without the accessibility permission.
 *
 * Android refuses sideloaded apps the accessibility toggle on recent versions,
 * and that permission is far wider than this app needs anyway. Instead we use
 * two ordinary special-access switches that a sideloaded app is allowed to get:
 *
 *   Usage access          - tells us which app came to the front
 *   Display over other apps - lets us put the block screen in front of it
 *
 * Neither can read the screen, typing or passwords.
 */
object Watcher {

    fun hasUsageAccess(c: Context): Boolean {
        val ops = c.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ops.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), c.packageName
            )
        } else {
            @Suppress("DEPRECATION")
            ops.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), c.packageName
            )
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    fun hasOverlay(c: Context): Boolean = Settings.canDrawOverlays(c)

    fun askUsageAccess(c: Context) {
        c.startActivity(
            Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
    }

    fun askOverlay(c: Context) {
        c.startActivity(
            Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + c.packageName)
            ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
    }

    /** The package that most recently came to the front, or null. */
    fun foregroundApp(c: Context): String? {
        val usm = c.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val now = System.currentTimeMillis()
        val events = usm.queryEvents(now - 10_000, now)
        val e = UsageEvents.Event()
        var last: String? = null
        while (events.hasNextEvent()) {
            events.getNextEvent(e)
            if (e.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND ||
                e.eventType == UsageEvents.Event.ACTIVITY_RESUMED
            ) {
                last = e.packageName
            }
        }
        return last
    }

    /**
     * The longest stretch last night in which no app was opened, in minutes.
     *
     * This is not sleep: it is the phone lying untouched, which is the only
     * thing the system can honestly tell us. Measured from 20:00 yesterday to
     * noon today, so a late night and a lie-in both still land inside it.
     */
    fun lastNightPhoneFree(c: Context): Int {
        if (!hasUsageAccess(c)) return 0
        val usm = c.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val cal = java.util.Calendar.getInstance()
        cal.set(java.util.Calendar.HOUR_OF_DAY, 12)
        cal.set(java.util.Calendar.MINUTE, 0)
        cal.set(java.util.Calendar.SECOND, 0)
        val noonToday = cal.timeInMillis
        val end = minOf(noonToday, System.currentTimeMillis())
        val start = end - 16 * 60 * 60 * 1000L

        val events = usm.queryEvents(start, end)
        val e = UsageEvents.Event()
        var prev = start
        var longest = 0L
        while (events.hasNextEvent()) {
            events.getNextEvent(e)
            if (e.eventType != UsageEvents.Event.MOVE_TO_FOREGROUND &&
                e.eventType != UsageEvents.Event.ACTIVITY_RESUMED
            ) continue
            val gap = e.timeStamp - prev
            if (gap > longest) longest = gap
            prev = e.timeStamp
        }
        val tail = end - prev
        if (tail > longest) longest = tail
        return (longest / 60000L).toInt()
    }

    fun shouldBlock(c: Context, pkg: String): Boolean {
        if (pkg == c.packageName) return false
        if (pkg in SessionStore.ALWAYS_ALLOWED) return false
        if (pkg.contains("launcher", true)) return false
        if (pkg.startsWith("com.android.")) return false
        return if (SessionStore.blockEverything(c)) true
        else SessionStore.blocked(c).contains(pkg)
    }
}
