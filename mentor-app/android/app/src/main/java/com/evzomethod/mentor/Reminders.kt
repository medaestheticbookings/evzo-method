package com.evzomethod.mentor

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.app.Notification
import java.util.Calendar

/**
 * Three nudges a day, from the phone itself.
 *
 * There is no server and no push service, so these are local alarms: the app
 * asks Android to wake it at a time, Android does, and the receiver posts a
 * notification and books the next one. That means they keep working with no
 * network, no account and nothing of his leaving the phone - the same rule the
 * rest of the app follows.
 *
 * The wording is deliberately the same every day. It is not a summary of his
 * data: Kotlin cannot read what the page keeps in its own storage, and faking
 * a personalised line ("you are behind on DMs") when the code cannot know that
 * would be exactly the kind of invented number this app refuses to print.
 * What the notification does is open the app at the moment the day needs it.
 */
object Reminders {

    const val CHANNEL = "mentor_daily"

    /** hour, minute, and which of the three messages belongs to it */
    private val SLOTS = listOf(
        Triple(8, 0, 0),    // morning: start the day
        Triple(12, 0, 1),   // midday: the money block
        Triple(21, 30, 2)   // evening: close it out
    )

    private val LINES = listOf(
        "Ξεκίνα τη μέρα" to "Άνοιξε το πρόγραμμα και πάρε τη σημερινή αποστολή.",
        "Πριν το μεσημέρι" to "10 DM και τα follow-up. Μετά τις 12 δεν μετράει το ίδιο.",
        "Κλείσε τη μέρα" to "Τσέκαρε το πρόγραμμα, ζυγίσου αύριο πρωί, οθόνες κάτω."
    )

    fun ensureChannel(ctx: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val ch = NotificationChannel(
            CHANNEL,
            "Καθημερινές υπενθυμίσεις",
            NotificationManager.IMPORTANCE_DEFAULT
        )
        ch.description = "Πρωί, μεσημέρι και βράδυ."
        ctx.getSystemService(NotificationManager::class.java)?.createNotificationChannel(ch)
    }

    /** Books every slot's next occurrence. Safe to call on every launch. */
    fun scheduleAll(ctx: Context) {
        ensureChannel(ctx)
        for ((h, m, which) in SLOTS) scheduleOne(ctx, h, m, which)
    }

    fun scheduleOne(ctx: Context, hour: Int, minute: Int, which: Int) {
        val am = ctx.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val at = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            if (timeInMillis <= System.currentTimeMillis()) add(Calendar.DAY_OF_YEAR, 1)
        }.timeInMillis

        val pi = PendingIntent.getBroadcast(
            ctx, which,
            Intent(ctx, ReminderReceiver::class.java)
                .setAction("com.evzomethod.mentor.FIRE")
                .putExtra("which", which),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        try {
            // Inexact on purpose: an exact alarm needs a special permission and
            // asks the system for a favour it does not owe a reminder app. A few
            // minutes of drift costs nothing here.
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi)
        } catch (e: SecurityException) {
            am.set(AlarmManager.RTC_WAKEUP, at, pi)
        }
    }

    fun post(ctx: Context, which: Int) {
        ensureChannel(ctx)
        val (title, body) = LINES[which.coerceIn(0, LINES.size - 1)]

        val open = PendingIntent.getActivity(
            ctx, 100 + which,
            Intent(ctx, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val n = Notification.Builder(ctx, CHANNEL)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(Notification.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setContentIntent(open)
            .build()

        try {
            ctx.getSystemService(NotificationManager::class.java)?.notify(200 + which, n)
        } catch (e: SecurityException) {
            // notifications turned off for the app: nothing to do, and nothing
            // worth crashing over
        }
    }

}

/**
 * Fires the notification and immediately books the same slot for tomorrow.
 * Also re-arms everything after a reboot, because alarms do not survive one.
 */
class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            "android.intent.action.QUICKBOOT_POWERON" -> Reminders.scheduleAll(ctx)
            else -> {
                val which = intent.getIntExtra("which", 0)
                Reminders.post(ctx, which)
                Reminders.scheduleAll(ctx)   // books tomorrow for every slot
            }
        }
    }
}
