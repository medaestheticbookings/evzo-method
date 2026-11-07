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

    private fun loop() {
        tick.postDelayed({
            if (!SessionStore.isActive(this)) {
                SessionStore.endSession(this)
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            } else {
                val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                nm.notify(ID, build())
                loop()
            }
        }, 30_000)
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
