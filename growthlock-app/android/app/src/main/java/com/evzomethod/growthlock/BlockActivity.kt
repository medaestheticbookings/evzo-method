package com.evzomethod.growthlock

import android.app.Activity
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

/** What you get instead of the app you just tried to open. */
class BlockActivity : Activity() {

    companion object {
        const val EXTRA_PKG = "pkg"
    }

    private val tick = Handler(Looper.getMainLooper())
    private lateinit var clock: TextView

    private val lines = listOf(
        "Future you asked us to hold this.",
        "Nothing new happened in the last four minutes.",
        "Your block is still running. So are you.",
        "That app will still be there later. Unfortunately.",
        "You chose this. Past you was right."
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (!SessionStore.isActive(this)) {
            finish()
            return
        }

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.BLACK)
            setPadding(60, 60, 60, 60)
        }

        clock = TextView(this).apply {
            textSize = 52f
            setTextColor(Color.parseColor("#3FB8C4"))
            typeface = Typeface.MONOSPACE
            gravity = Gravity.CENTER
        }
        val label = TextView(this).apply {
            val l = SessionStore.label(this@BlockActivity)
            text = if (l.isEmpty()) "Focus block" else l
            textSize = 18f
            setTextColor(Color.parseColor("#DCE6EC"))
            gravity = Gravity.CENTER
            setPadding(0, 28, 0, 10)
        }
        val line = TextView(this).apply {
            text = lines.random()
            textSize = 15f
            setTextColor(Color.parseColor("#6B7C8A"))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 34)
        }
        val back = Button(this).apply {
            text = "Return to my task"
            setOnClickListener { finish() }
        }

        root.addView(clock)
        root.addView(label)
        root.addView(line)
        root.addView(
            back,
            ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        )
        setContentView(root)
        paint()
    }

    private fun paint() {
        if (!SessionStore.isActive(this)) {
            finish()
            return
        }
        val ms = SessionStore.endAt(this) - System.currentTimeMillis()
        val s = if (ms > 0) ms / 1000 else 0
        clock.text = String.format("%02d:%02d", s / 60, s % 60)
        tick.postDelayed({ paint() }, 500)
    }

    override fun onDestroy() {
        tick.removeCallbacksAndMessages(null)
        super.onDestroy()
    }

    @Deprecated("Back must not be an escape hatch; it only closes this screen.")
    override fun onBackPressed() {
        finish()
    }
}
