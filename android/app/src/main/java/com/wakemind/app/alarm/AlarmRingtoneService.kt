package com.wakemind.app.alarm

import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import android.app.Service
import android.content.pm.ServiceInfo
import android.media.MediaPlayer

class AlarmRingtoneService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private var player: MediaPlayer? = null
  private var vibrator: Vibrator? = null
  private var wakeLock: PowerManager.WakeLock? = null
  private var currentAlarmId: String? = null

  override fun onBind(intent: Intent?) = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == AlarmIntents.ACTION_STOP) {
      stopRinging()
      return START_NOT_STICKY
    }
    val alarmId = intent?.getStringExtra(AlarmIntents.EXTRA_ALARM_ID)
    if (alarmId.isNullOrBlank()) {
      Log.e(ALARM_LOG_TAG, "Ringtone service started without an alarm id.")
      stopRinging()
      return START_NOT_STICKY
    }
    val label = intent.getStringExtra(AlarmIntents.EXTRA_LABEL) ?: AlarmDefaults.DEFAULT_LABEL
    val vibrate = intent.getBooleanExtra(AlarmIntents.EXTRA_VIBRATE, true)
    val triggerAt = intent.getLongExtra(AlarmIntents.EXTRA_TRIGGER_AT, System.currentTimeMillis())
    val puzzleImageId = intent.getStringExtra(AlarmIntents.EXTRA_PUZZLE_IMAGE_ID)
    val puzzleImageType = intent.getStringExtra(AlarmIntents.EXTRA_PUZZLE_IMAGE_TYPE)
    val difficulty = intent.getStringExtra(AlarmIntents.EXTRA_DIFFICULTY)
    val sound = intent.getStringExtra(AlarmIntents.EXTRA_SOUND) ?: AlarmDefaults.DEFAULT_ALARM_SOUND_ID
    promoteToForeground(alarmId, label, vibrate, triggerAt, puzzleImageId, puzzleImageType, difficulty)
    if (isRinging && currentAlarmId == alarmId) {
      return START_REDELIVER_INTENT
    }
    try {
      startAlert(vibrate, sound)
      currentAlarmId = alarmId
      currentRingingAlarmId = alarmId
      isRinging = true
      scheduleSafetyStop()
    } catch (error: Exception) {
      Log.e(ALARM_LOG_TAG, "Alarm audio failed for $alarmId", error)
    }
    return START_REDELIVER_INTENT
  }

  override fun onDestroy() {
    releaseAlert()
    super.onDestroy()
  }

  private fun promoteToForeground(
      alarmId: String,
      label: String,
      vibrate: Boolean,
      triggerAtMillis: Long,
      puzzleImageId: String? = null,
      puzzleImageType: String? = null,
      difficulty: String? = null,
  ) {
    AlarmNotifications.ensureChannel(this)
    val notification =
        AlarmNotifications.buildRingingNotification(
            this,
            alarmId,
            label,
            vibrate,
            triggerAtMillis,
            puzzleImageId,
            puzzleImageType,
            difficulty,
        )
    val type =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
        } else {
          0
        }
    ServiceCompat.startForeground(this, AlarmNotifications.NOTIFICATION_ID, notification, type)
    acquireWakeLock()
  }

  private fun startAlert(vibrate: Boolean, sound: String = AlarmDefaults.DEFAULT_ALARM_SOUND_ID) {
    releasePlayer()
    startAlarmAudio(sound)
    if (vibrate) {
      startVibration()
    }
  }

  private fun startAlarmAudio(soundId: String = AlarmDefaults.DEFAULT_ALARM_SOUND_ID) {
    try {
      val resId =
          when (soundId.trim().lowercase()) {
            "gentle_morning" -> com.wakemind.app.R.raw.gentle_morning
            "classic_alarm" -> com.wakemind.app.R.raw.classic_alarm
            "deep_wake" -> com.wakemind.app.R.raw.deep_wake
            "nature_wake" -> com.wakemind.app.R.raw.nature_wake
            "energetic_wake" -> com.wakemind.app.R.raw.energetic_wake
            else -> resources.getIdentifier(soundId.trim().lowercase(), "raw", packageName).takeIf { it != 0 }
          }

      if (resId != null && resId != 0) {
        val audioAttributes =
            AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
        val afd = resources.openRawResourceFd(resId)
        val mediaPlayer = MediaPlayer()
        mediaPlayer.setAudioAttributes(audioAttributes)
        mediaPlayer.setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
        afd.close()
        mediaPlayer.isLooping = true
        mediaPlayer.prepare()
        mediaPlayer.start()
        player = mediaPlayer
        return
      }
    } catch (rawError: Exception) {
      Log.w(ALARM_LOG_TAG, "Could not load raw audio resource for $soundId, falling back to system alarm", rawError)
    }

    val uri =
        RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
    if (uri == null) {
      Log.e(ALARM_LOG_TAG, "No system alarm sound is available.")
      return
    }
    val mediaPlayer = MediaPlayer()
    mediaPlayer.setAudioAttributes(
        AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build(),
    )
    mediaPlayer.setDataSource(this, uri)
    mediaPlayer.isLooping = true
    mediaPlayer.prepare()
    mediaPlayer.start()
    player = mediaPlayer
  }

  private fun startVibration() {
    val nextVibrator =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          getSystemService(VibratorManager::class.java).defaultVibrator
        } else {
          @Suppress("DEPRECATION")
          getSystemService(Vibrator::class.java)
        }
    vibrator = nextVibrator
    if (nextVibrator == null || !nextVibrator.hasVibrator()) {
      Log.w(ALARM_LOG_TAG, "This device has no vibrator.")
      return
    }
    val pattern = longArrayOf(0, 800, 400)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      nextVibrator.vibrate(VibrationEffect.createWaveform(pattern, 0))
    } else {
      @Suppress("DEPRECATION")
      nextVibrator.vibrate(pattern, 0)
    }
  }

  private fun acquireWakeLock() {
    if (wakeLock?.isHeld == true) {
      return
    }
    val powerManager = getSystemService(PowerManager::class.java)
    wakeLock =
        powerManager
            .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "WakeMind:AlarmRing")
            .apply {
              setReferenceCounted(false)
              acquire(AlarmTime.RINGING_SAFETY_MINUTES * 60 * 1000L)
            }
  }

  private fun scheduleSafetyStop() {
    handler.removeCallbacksAndMessages(null)
    handler.postDelayed(
        {
          Log.w(ALARM_LOG_TAG, "Stopping alarm after the safety timeout.")
          stopRinging()
        },
        AlarmTime.RINGING_SAFETY_MINUTES * 60 * 1000L,
    )
  }

  private fun stopRinging() {
    handler.removeCallbacksAndMessages(null)
    releaseAlert()
    isRinging = false
    currentRingingAlarmId = null
    currentAlarmId = null
    try {
      ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
    } catch (error: Exception) {
      Log.e(ALARM_LOG_TAG, "Could not remove the alarm notification.", error)
    }
    stopSelf()
  }

  private fun releaseAlert() {
    releasePlayer()
    try {
      vibrator?.cancel()
    } catch (error: Exception) {
      Log.e(ALARM_LOG_TAG, "Could not stop vibration.", error)
    }
    vibrator = null
    val lock = wakeLock
    if (lock?.isHeld == true) {
      lock.release()
    }
    wakeLock = null
  }

  private fun releasePlayer() {
    val mediaPlayer = player ?: return
    player = null
    try {
      if (mediaPlayer.isPlaying) {
        mediaPlayer.stop()
      }
      mediaPlayer.release()
    } catch (error: Exception) {
      Log.e(ALARM_LOG_TAG, "Could not release alarm audio.", error)
    }
  }

  companion object {
    @Volatile var isRinging: Boolean = false
    @Volatile var currentRingingAlarmId: String? = null

    internal fun start(context: Context, alarm: StoredAlarm) {
      val intent =
          Intent(context, AlarmRingtoneService::class.java).apply {
            action = AlarmIntents.ACTION_START
            putExtra(AlarmIntents.EXTRA_ALARM_ID, alarm.id)
            putExtra(AlarmIntents.EXTRA_LABEL, alarm.label)
            putExtra(AlarmIntents.EXTRA_VIBRATE, alarm.vibrate)
            putExtra(AlarmIntents.EXTRA_TRIGGER_AT, alarm.triggerAtMillis)
            putExtra(AlarmIntents.EXTRA_PUZZLE_IMAGE_ID, alarm.puzzleImageId)
            putExtra(AlarmIntents.EXTRA_PUZZLE_IMAGE_TYPE, alarm.puzzleImageType)
            putExtra(AlarmIntents.EXTRA_DIFFICULTY, alarm.difficulty)
            putExtra(AlarmIntents.EXTRA_SOUND, alarm.sound)
          }
      ContextCompat.startForegroundService(context, intent)
    }

    internal fun stop(context: Context) {
      val intent =
          Intent(context, AlarmRingtoneService::class.java).apply {
            action = AlarmIntents.ACTION_STOP
          }
      context.startService(intent)
    }

    internal fun dismissAfterPuzzle(context: Context, alarmId: String): Boolean {
      if (alarmId.isBlank()) {
        throw IllegalArgumentException("Alarm ID cannot be blank.")
      }
      val activeId = currentRingingAlarmId
      if (!isRinging || activeId == null) {
        return false
      }
      if (activeId != alarmId) {
        Log.w(ALARM_LOG_TAG, "Dismissal rejected: requested $alarmId but ringing $activeId")
        return false
      }
      stop(context)
      return true
    }
  }
}
