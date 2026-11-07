package com.evzomethod.growthlock

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent

/**
 * The actual enforcement. Android tells an accessibility service which app just
 * came to the front; if a block is running and that app is not allowed, we send
 * the user home and put our own full-screen block screen in front of it.
 *
 * This is the same mechanism every Android blocker uses, and it has the same
 * honest limit: someone determined can still switch the service off in Settings.
 */
class BlockerService : AccessibilityService() {

    private var lastBlockShown = 0L

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        if (!SessionStore.isActive(this)) return

        val pkg = event.packageName?.toString() ?: return
        if (!shouldBlock(pkg)) return

        performGlobalAction(GLOBAL_ACTION_HOME)

        val now = System.currentTimeMillis()
        if (now - lastBlockShown < 700) return
        lastBlockShown = now

        val i = Intent(this, BlockActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra(BlockActivity.EXTRA_PKG, pkg)
        }
        startActivity(i)
    }

    private fun shouldBlock(pkg: String): Boolean {
        if (pkg in SessionStore.ALWAYS_ALLOWED) return false
        if (pkg == packageName) return false
        // The home screen itself is not a distraction, so launchers stay usable.
        if (pkg.contains("launcher", true)) return false
        return if (SessionStore.blockEverything(this)) true
        else SessionStore.blocked(this).contains(pkg)
    }

    override fun onInterrupt() {}

    override fun onServiceConnected() {
        super.onServiceConnected()
        if (SessionStore.isActive(this)) LockService.start(this)
    }
}
