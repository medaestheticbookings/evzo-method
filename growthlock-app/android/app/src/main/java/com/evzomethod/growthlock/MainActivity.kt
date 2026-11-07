package com.evzomethod.growthlock

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast

/**
 * One screen, three taps at most: allow the permission once, pick a length,
 * press start. Everything else is deliberately absent.
 */
class MainActivity : Activity() {

    private val ink = Color.parseColor("#E4EDF3")
    private val muted = Color.parseColor("#8B9BA8")
    private val teal = Color.parseColor("#3FB8C4")
    private val card = Color.parseColor("#18212A")
    private val bg = Color.parseColor("#0F1419")

    private var minutes = 25
    private val tick = Handler(Looper.getMainLooper())
    private lateinit var root: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val scroll = ScrollView(this).apply { setBackgroundColor(bg) }
        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 90, 48, 60)
        }
        scroll.addView(root)
        setContentView(scroll)
        draw()
    }

    override fun onResume() {
        super.onResume()
        draw()
    }

    private fun draw() {
        root.removeAllViews()
        root.addView(title("GrowthLock"))

        if (SessionStore.isActive(this)) {
            drawRunning()
        } else if (!serviceEnabled()) {
            drawPermission()
        } else {
            drawStart()
        }
    }

    /* ---------- the one permission ---------- */

    private fun drawPermission() {
        root.addView(body("One tap and the blocking works. Android asks you to switch GrowthLock on in its accessibility list - that is the permission that lets it see which app is in front and close it."))
        root.addView(bigButton("Allow blocking") {
            Toast.makeText(this, "Find GrowthLock in the list and turn it on", Toast.LENGTH_LONG).show()
            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        })
        root.addView(note("Nothing is uploaded. The app reads only the name of the app in front, and only on this phone."))
    }

    /* ---------- idle ---------- */

    private fun drawStart() {
        root.addView(body("Pick how long. Everything distracting closes itself until the time is up."))

        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, 18, 0, 18)
        }
        listOf(15, 25, 45, 90).forEach { m ->
            row.addView(chip(m), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        }
        root.addView(row)

        val everything = SessionStore.blockEverything(this)
        root.addView(toggle(
            if (everything) "Blocking: everything except calls" else "Blocking: the usual suspects only"
        ) {
            SessionStore.setBlockEverything(this, !everything)
            draw()
        })

        root.addView(bigButton("Start the block") {
            SessionStore.startSession(this, minutes, false, "Focus block")
            LockService.start(this)
            draw()
        })
        root.addView(note("Calls, the dialler and emergency always stay open."))
    }

    /* ---------- running ---------- */

    private fun drawRunning() {
        val clock = TextView(this).apply {
            textSize = 58f
            setTextColor(teal)
            typeface = Typeface.MONOSPACE
            gravity = Gravity.CENTER
            setPadding(0, 40, 0, 10)
        }
        root.addView(clock)
        root.addView(body("Blocking is on. Put the phone down."))
        root.addView(bigButton("End the block") {
            SessionStore.endSession(this)
            LockService.stop(this)
            draw()
        })

        fun paint() {
            if (!SessionStore.isActive(this)) { draw(); return }
            val s = (SessionStore.endAt(this) - System.currentTimeMillis()) / 1000
            clock.text = String.format("%02d:%02d", s / 60, s % 60)
            tick.postDelayed({ paint() }, 500)
        }
        tick.removeCallbacksAndMessages(null)
        paint()
    }

    /* ---------- small view helpers ---------- */

    private fun title(s: String) = TextView(this).apply {
        text = s
        textSize = 32f
        setTextColor(ink)
        setPadding(0, 0, 0, 16)
    }

    private fun body(s: String) = TextView(this).apply {
        text = s
        textSize = 16f
        setTextColor(muted)
        setPadding(0, 0, 0, 10)
    }

    private fun note(s: String) = TextView(this).apply {
        text = s
        textSize = 13f
        setTextColor(Color.parseColor("#5C6B7A"))
        setPadding(0, 22, 0, 0)
    }

    private fun chip(m: Int): View = Button(this).apply {
        text = m.toString()
        setTextColor(if (m == minutes) Color.parseColor("#05171A") else ink)
        background = GradientDrawable().apply {
            cornerRadius = 26f
            setColor(if (m == minutes) teal else card)
        }
        setOnClickListener { minutes = m; draw() }
    }

    private fun toggle(s: String, f: () -> Unit) = Button(this).apply {
        text = s
        textSize = 14f
        setTextColor(ink)
        background = GradientDrawable().apply { cornerRadius = 26f; setColor(card) }
        setOnClickListener { f() }
    }

    private fun bigButton(s: String, f: () -> Unit) = Button(this).apply {
        text = s
        textSize = 18f
        setTextColor(Color.parseColor("#05171A"))
        background = GradientDrawable().apply { cornerRadius = 30f; setColor(teal) }
        setPadding(0, 40, 0, 40)
        setOnClickListener { f() }
        layoutParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = 26 }
    }

    /** Is our accessibility service switched on? */
    private fun serviceEnabled(): Boolean {
        val flat = Settings.Secure.getString(
            contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false
        return flat.contains(packageName + "/" + BlockerService::class.java.name) ||
            flat.contains(packageName + "/.BlockerService")
    }

    override fun onDestroy() {
        tick.removeCallbacksAndMessages(null)
        super.onDestroy()
    }
}
