package com.evzomethod.growthlock

import android.app.Activity
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

/**
 * One screen. Two switches the first time, then: pick a length, press start.
 *
 * The two switches are ordinary special-access toggles that every Android
 * version allows a sideloaded app to request - unlike the accessibility list,
 * which recent Android hides from apps installed outside the Play Store.
 */
class MainActivity : Activity() {

    private val ink = Color.parseColor("#E4EDF3")
    private val muted = Color.parseColor("#8B9BA8")
    private val teal = Color.parseColor("#3FB8C4")
    private val card = Color.parseColor("#18212A")
    private val bg = Color.parseColor("#0F1419")
    private val ok = Color.parseColor("#6FC08C")

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
        tick.removeCallbacksAndMessages(null)
        root.removeAllViews()
        root.addView(title("GrowthLock"))

        when {
            SessionStore.isActive(this) -> drawRunning()
            !ready() -> drawSetup()
            else -> drawStart()
        }
    }

    private fun ready() = Watcher.hasUsageAccess(this) && Watcher.hasOverlay(this)

    /* ---------- first run: two switches ---------- */

    private fun drawSetup() {
        root.addView(body("Two switches, once. Android keeps both of these out of the way, so the app cannot turn them on for you."))

        val usage = Watcher.hasUsageAccess(this)
        root.addView(step(1, "See which app is open", usage) { Watcher.askUsageAccess(this) })
        root.addView(hint("Find GrowthLock in the list and turn it on."))

        val overlay = Watcher.hasOverlay(this)
        root.addView(step(2, "Show the block screen", overlay) { Watcher.askOverlay(this) })
        root.addView(hint("Allow GrowthLock to display over other apps."))

        root.addView(note("Neither switch can read your screen, your typing or your passwords. The app has no internet permission at all, so nothing can leave this phone."))
    }

    /* ---------- idle ---------- */

    private fun drawStart() {
        root.addView(body("Pick how long. Distracting apps close themselves until the time is up."))

        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, 18, 0, 10)
        }
        listOf(15, 25, 45, 90).forEach { m ->
            row.addView(chip(m), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        }
        root.addView(row)

        val everything = SessionStore.blockEverything(this)
        root.addView(flat(if (everything) "Blocking: everything except calls" else "Blocking: the usual suspects only") {
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
        paint()
    }

    /* ---------- views ---------- */

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

    private fun hint(s: String) = TextView(this).apply {
        text = s
        textSize = 13f
        setTextColor(Color.parseColor("#5C6B7A"))
        setPadding(6, 6, 0, 18)
    }

    private fun note(s: String) = TextView(this).apply {
        text = s
        textSize = 13f
        setTextColor(Color.parseColor("#5C6B7A"))
        setPadding(0, 22, 0, 0)
    }

    private fun step(n: Int, label: String, done: Boolean, f: () -> Unit): View =
        Button(this).apply {
            text = if (done) "$n. $label  -  on" else "$n. $label"
            textSize = 16f
            isAllCaps = false
            setTextColor(if (done) ok else Color.parseColor("#05171A"))
            background = GradientDrawable().apply {
                cornerRadius = 26f
                setColor(if (done) card else teal)
            }
            setPadding(0, 34, 0, 34)
            setOnClickListener { if (!done) f() }
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = 14 }
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

    private fun flat(s: String, f: () -> Unit) = Button(this).apply {
        text = s
        textSize = 14f
        isAllCaps = false
        setTextColor(ink)
        background = GradientDrawable().apply { cornerRadius = 26f; setColor(card) }
        setOnClickListener { f() }
    }

    private fun bigButton(s: String, f: () -> Unit) = Button(this).apply {
        text = s
        textSize = 18f
        isAllCaps = false
        setTextColor(Color.parseColor("#05171A"))
        background = GradientDrawable().apply { cornerRadius = 30f; setColor(teal) }
        setPadding(0, 40, 0, 40)
        setOnClickListener { f() }
        layoutParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = 26 }
    }

    override fun onDestroy() {
        tick.removeCallbacksAndMessages(null)
        super.onDestroy()
    }
}
