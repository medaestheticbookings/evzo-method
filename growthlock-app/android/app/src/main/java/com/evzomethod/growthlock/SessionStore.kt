package com.evzomethod.growthlock

import android.content.Context

/**
 * The whole session lives in SharedPreferences, so a reboot, a crash or the
 * system killing the app cannot quietly end a block: whoever wakes up next
 * reads the end time and carries on enforcing.
 */
object SessionStore {
    private const val FILE = "growthlock"
    private const val K_END = "end_at"
    private const val K_STRICT = "strict"
    private const val K_BLOCKED = "blocked"
    private const val K_ALLOW_ALL_EXCEPT = "mode_blocklist"
    private const val K_LABEL = "label"

    private fun prefs(c: Context) = c.getSharedPreferences(FILE, Context.MODE_PRIVATE)

    fun startSession(c: Context, minutes: Int, strict: Boolean, label: String) {
        prefs(c).edit()
            .putLong(K_END, System.currentTimeMillis() + minutes * 60_000L)
            .putBoolean(K_STRICT, strict)
            .putString(K_LABEL, label)
            .apply()
    }

    fun endSession(c: Context) = prefs(c).edit().remove(K_END).apply()

    fun endAt(c: Context): Long = prefs(c).getLong(K_END, 0L)

    fun isActive(c: Context): Boolean = endAt(c) > System.currentTimeMillis()

    fun minutesLeft(c: Context): Int {
        val ms = endAt(c) - System.currentTimeMillis()
        return if (ms <= 0) 0 else ((ms + 59_999) / 60_000).toInt()
    }

    fun isStrict(c: Context): Boolean = prefs(c).getBoolean(K_STRICT, false)

    fun label(c: Context): String = prefs(c).getString(K_LABEL, "") ?: ""

    /** true = block everything except the essentials; false = block only the chosen list */
    fun blockEverything(c: Context): Boolean = prefs(c).getBoolean(K_ALLOW_ALL_EXCEPT, true)

    fun setBlockEverything(c: Context, v: Boolean) =
        prefs(c).edit().putBoolean(K_ALLOW_ALL_EXCEPT, v).apply()

    fun blocked(c: Context): MutableSet<String> =
        HashSet(prefs(c).getStringSet(K_BLOCKED, DEFAULT_BLOCKED) ?: DEFAULT_BLOCKED).toMutableSet()

    fun setBlocked(c: Context, set: Set<String>) =
        prefs(c).edit().putStringSet(K_BLOCKED, set).apply()

    /** Never blocked: dialling, emergencies, the system UI and this app itself. */
    val ALWAYS_ALLOWED = setOf(
        "com.android.dialer",
        "com.google.android.dialer",
        "com.samsung.android.dialer",
        "com.android.server.telecom",
        "com.android.phone",
        "com.android.incallui",
        "com.android.emergency",
        "com.android.settings",
        "com.android.systemui",
        "com.evzomethod.growthlock"
    )

    val DEFAULT_BLOCKED = setOf(
        "com.instagram.android",
        "com.zhiliaoapp.musically",
        "com.ss.android.ugc.trill",
        "com.facebook.katana",
        "com.facebook.lite",
        "com.google.android.youtube",
        "com.twitter.android",
        "com.snapchat.android",
        "com.reddit.frontpage",
        "com.netflix.mediaclient",
        "com.pinterest",
        "com.linkedin.android"
    )
}
