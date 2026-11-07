package com.evzomethod.growthlock

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

/**
 * What you get instead of the app you just tried to open.
 *
 * It always says how to get out, because a lock whose exit is a mystery is a
 * trap, not a tool: open GrowthLock and end the block there.
 */
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
            setPadding(70, 70, 70, 70)
        }

        clock = TextView(this).apply {
            textSize = 52f
            setTextColor(Color.parseColor("#FFE14D"))
            typeface = Typeface.MONOSPACE
            gravity = Gravity.CENTER
        }
        val label = TextView(this).apply {
            val l = SessionStore.label(this@BlockActivity)
            text = if (l.isEmpty()) "Focus block" else l
            textSize = 18f
            setTextColor(Color.parseColor("#FFFFFF"))
            gravity = Gravity.CENTER
            setPadding(0, 26, 0, 8)
        }
        val line = TextView(this).apply {
            text = lines.random()
            textSize = 15f
            setTextColor(Color.parseColor("#7A849A"))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 30)
        }

        root.addView(clock)
        root.addView(label)
        root.addView(line)
        root.addView(button("Back to the home screen", true) { goHome() })
        root.addView(button("Open GrowthLock", false) { openApp() })
        root.addView(TextView(this).apply {
            text = "To end the block early, open GrowthLock and hold the unlock button there."
            textSize = 13f
            setTextColor(Color.parseColor("#5C6478"))
            gravity = Gravity.CENTER
            setPadding(0, 22, 0, 0)
        })

        setContentView(root)
        paint()
    }

    private fun goHome() {
        startActivity(
            Intent(Intent.ACTION_MAIN)
                .addCategory(Intent.CATEGORY_HOME)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
        finish()
    }

    private fun openApp() {
        startActivity(
            Intent(this, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        )
        finish()
    }

    private fun button(s: String, filled: Boolean, f: () -> Unit) = Button(this).apply {
        text = s
        textSize = 16f
        isAllCaps = false
        setTextColor(if (filled) Color.parseColor("#06101B") else Color.parseColor("#7A849A"))
        background = GradientDrawable().apply {
            cornerRadius = 28f
            if (filled) setColor(Color.parseColor("#FFE14D"))
            else { setColor(Color.TRANSPARENT); setStroke(2, Color.parseColor("#26324A")) }
        }
        setPadding(0, 32, 0, 32)
        setOnClickListener { f() }
        layoutParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = 12 }
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

    @Deprecated("Back goes home rather than back into the blocked app.")
    override fun onBackPressed() {
        goHome()
    }
}
