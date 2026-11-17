package com.wakemind.app.alarm

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import java.util.concurrent.ConcurrentHashMap

internal object SnoozeCountdownNotifier {
  private val handler by lazy {
    try {
      Handler(Looper.getMainLooper())
    } catch (e: Exception) {
      null
    }
  }
  private val activeJobs = ConcurrentHashMap<String, Runnable>()

  fun start(context: Context, record: SnoozeRecord) {
    stop(record.occurrenceId)
    val appContext = context.applicationContext ?: context

    val runnable = object : Runnable {
      override fun run() {
        val now = System.currentTimeMillis()
        val remaining = record.triggerAtMillis - now
        if (remaining <= 0) {
          stop(record.occurrenceId)
          return
        }
        AlarmNotifications.updateSnoozeNotification(appContext, record, remaining)
        val delay = Math.max(200L, 1000L - (now % 1000L))
        try {
          handler?.postDelayed(this, delay)
        } catch (e: Exception) {
          Log.w(ALARM_LOG_TAG, "Could not schedule snooze countdown update", e)
        }
      }
    }
    activeJobs[record.occurrenceId] = runnable
    try {
      handler?.post(runnable)
    } catch (e: Exception) {
      Log.w(ALARM_LOG_TAG, "Could not start snooze countdown update", e)
    }
  }

  fun stop(occurrenceId: String) {
    activeJobs.remove(occurrenceId)?.let { runnable ->
      try {
        handler?.removeCallbacks(runnable)
      } catch (e: Exception) {
        // Safe ignore in non-looper / test environments
      }
    }
  }

  fun stopAll() {
    for ((_, runnable) in activeJobs) {
      try {
        handler?.removeCallbacks(runnable)
      } catch (e: Exception) {
        // Safe ignore
      }
    }
    activeJobs.clear()
  }
}
