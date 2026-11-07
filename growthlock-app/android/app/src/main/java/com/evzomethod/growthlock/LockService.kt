package com.evzomethod.growthlock

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper

/**
 * Keeps the countdown in the notification shade for the whole block. It is also
 * what keeps the process alive, so leaving the app or rebooting does not quietly
 * end a session.
 */
class LockService : Service() {

    companion object {
        private const val CH = "growthlock.block"
        private const val ID = 42

        fun start(c: Context) {
            val i = Intent(c, LockService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) c.startForegroundService(i)
            else c.startService(i)
        }

        fun stop(c: Context) {
            c.stopService(Intent(c, LockService::class.java))
        }
    }

    private val tick = Handler(Looper.getMainLooper())

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        channel()
        startForeground(ID, build())
        loop()
        return START_STICKY
    }

    private var lastShown = 0L
    private var ticks = 0

    /**
     * One second is the whole enforcement loop: ask the system which app is in
     * front, and if it is not allowed, put the block screen over it.
     */
    private fun loop() {
        tick.postDelayed({
            if (!SessionStore.isActive(this)) {
                SessionStore.endSession(this)
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return@postDelayed
            }
            guard()
            if (++ticks % 30 == 0) {
                val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                nm.notify(ID, build())
            }
            loop()
        }, 1_000)
    }

    private fun guard() {
        if (!Watcher.hasUsageAccess(this)) return
        val pkg = Watcher.foregroundApp(this) ?: return
        if (!Watcher.shouldBlock(this, pkg)) return
        val now = System.currentTimeMillis()
        if (now - lastShown < 1_200) return
        lastShown = now
        startActivity(
            Intent(this, BlockActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                .putExtra(BlockActivity.EXTRA_PKG, pkg)
        )
    }

    private fun channel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val ch = NotificationChannel(CH, "Focus block", NotificationManager.IMPORTANCE_LOW)
            ch.setShowBadge(false)
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(ch)
        }
    }

    private fun build(): Notification {
        val open = PendingIntent.getActivity(
            this, 0, Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val left = SessionStore.minutesLeft(this)
        val b = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CH)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }
        return b.setContentTitle("GrowthLock is running")
            .setContentText(left.toString() + " min left - distracting apps are blocked")
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .setOngoing(true)
            .setContentIntent(open)
            .build()
    }

    override fun onDestroy() {
        tick.removeCallbacksAndMessages(null)
        super.onDestroy()
    }
}
