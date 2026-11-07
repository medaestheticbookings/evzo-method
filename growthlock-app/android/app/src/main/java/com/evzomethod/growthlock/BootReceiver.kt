package com.evzomethod.growthlock

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** A restart must not end a block: pick the session up where it was. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (SessionStore.isActive(context)) LockService.start(context)
    }
}
