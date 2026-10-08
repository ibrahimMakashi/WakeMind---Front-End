package com.wakemind.app.alarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat

internal object AlarmNotifications {
  const val CHANNEL_ID = "wakemind.alarm.v1"
  const val NOTIFICATION_ID = 4101

  fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val manager = context.getSystemService(NotificationManager::class.java)
    if (manager.getNotificationChannel(CHANNEL_ID) != null) {
      return
    }
    val channel =
        NotificationChannel(CHANNEL_ID, "Alarms", NotificationManager.IMPORTANCE_HIGH).apply {
          description = "WakeMind alarms"
          setSound(null, null)
          enableVibration(false)
          lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        }
    manager.createNotificationChannel(channel)
  }

  fun buildRingingNotification(
      context: Context,
      alarmId: String,
      label: String,
      vibrate: Boolean,
      triggerAtMillis: Long,
  ): Notification {
    val activityIntent = ringingIntent(context, alarmId, label, vibrate, triggerAtMillis)
    val pending =
        PendingIntent.getActivity(
            context,
            requestCode(alarmId),
            activityIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    return NotificationCompat.Builder(context, CHANNEL_ID)
        .setSmallIcon(com.wakemind.app.R.drawable.ic_alarm_notification)
        .setContentTitle("WakeMind")
        .setContentText(label)
        .setCategory(NotificationCompat.CATEGORY_ALARM)
        .setPriority(NotificationCompat.PRIORITY_MAX)
        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
        .setOngoing(true)
        .setAutoCancel(false)
        .setFullScreenIntent(pending, true)
        .setContentIntent(pending)
        .build()
  }

  fun ringingIntent(
      context: Context,
      alarmId: String,
      label: String,
      vibrate: Boolean,
      triggerAtMillis: Long,
  ): Intent {
    return Intent(context, RingingActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
      putExtra(AlarmIntents.EXTRA_ALARM_ID, alarmId)
      putExtra(AlarmIntents.EXTRA_LABEL, label)
      putExtra(AlarmIntents.EXTRA_VIBRATE, vibrate)
      putExtra(AlarmIntents.EXTRA_TRIGGER_AT, triggerAtMillis)
    }
  }

  private fun requestCode(alarmId: String): Int {
    return (alarmId.hashCode() xor 0x5F3759DF.toInt()) and 0x7FFFFFFF
  }
}
