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
      puzzleImageId: String? = null,
      puzzleImageType: String? = null,
      difficulty: String? = null,
      occurrenceId: String = "${alarmId}_${triggerAtMillis}",
      canSnooze: Boolean = true,
      sound: String = AlarmDefaults.DEFAULT_ALARM_SOUND_ID,
      alarmType: String? = null,
      ritualText: String? = null,
      repetitionTarget: Int? = null,
  ): Notification {
    val activityIntent =
        ringingIntent(
            context,
            alarmId,
            label,
            vibrate,
            triggerAtMillis,
            puzzleImageId,
            puzzleImageType,
            difficulty,
            occurrenceId,
            canSnooze,
            sound,
            alarmType,
            ritualText,
            repetitionTarget,
        )
    val contentPending =
        PendingIntent.getActivity(
            context,
            contentRequestCode(alarmId, occurrenceId),
            activityIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

    val stopPending =
        PendingIntent.getActivity(
            context,
            stopActionRequestCode(alarmId, occurrenceId),
            activityIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

    val isVision = alarmType == AlarmDefaults.ALARM_TYPE_VISION_RITUAL
    val notifTitle = if (isVision) "Vision Ritual" else "B-Discipline"
    val notifText = if (isVision && !ritualText.isNullOrBlank()) ritualText else label

    val builder =
        NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(com.wakemind.app.R.drawable.ic_alarm_notification)
            .setContentTitle(notifTitle)
            .setContentText(notifText)
            .setStyle(NotificationCompat.BigTextStyle().bigText(notifText))
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setFullScreenIntent(contentPending, true)
            .setContentIntent(contentPending)
            .addAction(com.wakemind.app.R.drawable.ic_alarm_notification, "STOP", stopPending)

    if (canSnooze) {
      val snoozeIntent =
          Intent(context, AlarmActionReceiver::class.java).apply {
            action = AlarmIntents.ACTION_SNOOZE
            putExtra(AlarmIntents.EXTRA_ALARM_ID, alarmId)
            putExtra(AlarmIntents.EXTRA_OCCURRENCE_ID, occurrenceId)
            putExtra(AlarmIntents.EXTRA_IS_SNOOZE, true)
          }
      val snoozePending =
          PendingIntent.getBroadcast(
              context,
              snoozeActionRequestCode(alarmId, occurrenceId),
              snoozeIntent,
              PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
          )
      builder.addAction(com.wakemind.app.R.drawable.ic_alarm_notification, "SNOOZE 5 MIN", snoozePending)
    }

    return builder.build()
  }

  fun ringingIntent(
      context: Context,
      alarmId: String,
      label: String,
      vibrate: Boolean,
      triggerAtMillis: Long,
      puzzleImageId: String? = null,
      puzzleImageType: String? = null,
      difficulty: String? = null,
      occurrenceId: String? = null,
      canSnooze: Boolean = true,
      sound: String = AlarmDefaults.DEFAULT_ALARM_SOUND_ID,
      alarmType: String? = null,
      ritualText: String? = null,
      repetitionTarget: Int? = null,
  ): Intent {
    val storeAlarm = AlarmStore(context).get(alarmId)
    val finalImageId = puzzleImageId ?: storeAlarm?.puzzleImageId ?: AlarmDefaults.DEFAULT_PUZZLE_IMAGE_ID
    val finalImageType = puzzleImageType ?: storeAlarm?.puzzleImageType ?: AlarmDefaults.DEFAULT_PUZZLE_IMAGE_TYPE
    val finalDifficulty = difficulty ?: storeAlarm?.difficulty ?: AlarmDefaults.DIFFICULTY_EASY
    val finalSound = if (sound != AlarmDefaults.DEFAULT_ALARM_SOUND_ID) sound else (storeAlarm?.sound ?: sound)
    val finalOccId = occurrenceId ?: "${alarmId}_${triggerAtMillis}"
    val finalAlarmType = alarmType ?: storeAlarm?.alarmType ?: AlarmDefaults.ALARM_TYPE_NORMAL
    val finalRitualText = ritualText ?: storeAlarm?.ritualText ?: ""
    val finalRepetitionTarget = repetitionTarget ?: storeAlarm?.repetitionTarget ?: AlarmDefaults.DEFAULT_REPETITION_TARGET

    val isVision = finalAlarmType == AlarmDefaults.ALARM_TYPE_VISION_RITUAL || finalRitualText.isNotBlank()
    val resolvedAlarmType = if (isVision) AlarmDefaults.ALARM_TYPE_VISION_RITUAL else AlarmDefaults.ALARM_TYPE_NORMAL
    val mode = if (isVision) AlarmIntents.MODE_VISION_RITUAL else AlarmIntents.MODE_ALARM

    return Intent(context, RingingActivity::class.java).apply {
      action = "com.wakemind.app.alarm.RING_${resolvedAlarmType}_${alarmId}_${finalOccId}"
      data = android.net.Uri.parse("wakemind://ringing/$resolvedAlarmType/$alarmId/$finalOccId")
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
      putExtra(AlarmIntents.EXTRA_ALARM_ID, alarmId)
      putExtra(AlarmIntents.EXTRA_OCCURRENCE_ID, finalOccId)
      putExtra(AlarmIntents.EXTRA_CAN_SNOOZE, canSnooze)
      putExtra(AlarmIntents.EXTRA_LABEL, label)
      putExtra(AlarmIntents.EXTRA_VIBRATE, vibrate)
      putExtra(AlarmIntents.EXTRA_TRIGGER_AT, triggerAtMillis)
      putExtra(AlarmIntents.EXTRA_PUZZLE_IMAGE_ID, finalImageId)
      putExtra(AlarmIntents.EXTRA_PUZZLE_IMAGE_TYPE, finalImageType)
      putExtra(AlarmIntents.EXTRA_DIFFICULTY, finalDifficulty)
      putExtra(AlarmIntents.EXTRA_SOUND, finalSound)
      putExtra(AlarmIntents.EXTRA_ALARM_TYPE, resolvedAlarmType)
      putExtra(AlarmIntents.EXTRA_MODE, mode)
      putExtra(AlarmIntents.EXTRA_RITUAL_TEXT, finalRitualText)
      putExtra(AlarmIntents.EXTRA_REPETITION_TARGET, finalRepetitionTarget)
    }
  }

  fun contentRequestCode(alarmId: String, occurrenceId: String): Int {
    return ("$alarmId:$occurrenceId:content").hashCode() and 0x7FFFFFFF
  }

  fun stopActionRequestCode(alarmId: String, occurrenceId: String): Int {
    return ("$alarmId:$occurrenceId:stop_action").hashCode() and 0x7FFFFFFF
  }

  fun snoozeActionRequestCode(alarmId: String, occurrenceId: String): Int {
    return ("$alarmId:$occurrenceId:snooze_action").hashCode() and 0x7FFFFFFF
  }

  fun snoozeNotificationId(occurrenceId: String): Int {
    return ("snooze:$occurrenceId").hashCode() and 0x7FFFFFFF
  }

  fun formatRemaining(remainingMillis: Long): String {
    val totalSeconds = Math.max(0L, (remainingMillis + 999L) / 1000L)
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    return "%d:%02d".format(minutes, seconds)
  }

  fun buildSnoozeNotification(
      context: Context,
      record: SnoozeRecord,
      remainingMillis: Long = record.triggerAtMillis - System.currentTimeMillis(),
  ): Notification {
    ensureChannel(context)
    val timeFormatted = formatRemaining(remainingMillis)
    val countdownText = "$timeFormatted remaining"
    val contentText =
        if (record.label.isNotBlank() && record.label != AlarmDefaults.DEFAULT_LABEL) {
          "${record.label} • $countdownText"
        } else {
          countdownText
        }

    val openAppIntent =
        Intent(context, com.wakemind.app.MainActivity::class.java).apply {
          flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
    val contentPending =
        PendingIntent.getActivity(
            context,
            contentRequestCode(record.alarmId, record.occurrenceId),
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

    val stopIntent =
        Intent(context, AlarmActionReceiver::class.java).apply {
          action = AlarmIntents.ACTION_CANCEL_SNOOZE
          putExtra(AlarmIntents.EXTRA_ALARM_ID, record.alarmId)
          putExtra(AlarmIntents.EXTRA_OCCURRENCE_ID, record.occurrenceId)
        }
    val stopPending =
        PendingIntent.getBroadcast(
            context,
            stopActionRequestCode(record.alarmId, record.occurrenceId),
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

    return NotificationCompat.Builder(context, CHANNEL_ID)
        .setSmallIcon(com.wakemind.app.R.drawable.ic_alarm_notification)
        .setContentTitle("B-Discipline")
        .setSubText("Alarm snoozed")
        .setContentText(contentText)
        .setCategory(NotificationCompat.CATEGORY_ALARM)
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
        .setOngoing(true)
        .setAutoCancel(false)
        .setOnlyAlertOnce(true)
        .setUsesChronometer(true)
        .setChronometerCountDown(true)
        .setWhen(record.triggerAtMillis)
        .setContentIntent(contentPending)
        .addAction(com.wakemind.app.R.drawable.ic_alarm_notification, "STOP", stopPending)
        .build()
  }

  fun showSnoozeNotification(context: Context, record: SnoozeRecord) {
    try {
      val notification = buildSnoozeNotification(context, record)
      val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
      manager?.notify(snoozeNotificationId(record.occurrenceId), notification)
    } catch (e: Exception) {
      android.util.Log.e(ALARM_LOG_TAG, "Failed to show snooze notification for ${record.occurrenceId}", e)
    }
  }

  fun updateSnoozeNotification(context: Context, record: SnoozeRecord, remainingMillis: Long) {
    try {
      val notification = buildSnoozeNotification(context, record, remainingMillis)
      val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
      manager?.notify(snoozeNotificationId(record.occurrenceId), notification)
    } catch (e: Exception) {
      android.util.Log.e(ALARM_LOG_TAG, "Failed to update snooze notification for ${record.occurrenceId}", e)
    }
  }

  fun cancelSnoozeNotification(context: Context, occurrenceId: String) {
    try {
      val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
      manager?.cancel(snoozeNotificationId(occurrenceId))
    } catch (e: Exception) {
      android.util.Log.e(ALARM_LOG_TAG, "Failed to cancel snooze notification for $occurrenceId", e)
    }
  }
}
