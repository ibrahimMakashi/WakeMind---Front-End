package com.wakemind.app.alarm

import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.WindowManager
import androidx.activity.OnBackPressedCallback
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import java.lang.ref.WeakReference

class RingingActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    showOverLockScreen()
    super.onCreate(null)
    activeInstance = WeakReference(this)

    // Disable hardware back button during real alarm ringing. Must solve the puzzle.
    onBackPressedDispatcher.addCallback(
        this,
        object : OnBackPressedCallback(true) {
          override fun handleOnBackPressed() {
            // No back dismissal allowed.
          }
        },
    )
  }

  override fun onNewIntent(intent: android.content.Intent?) {
    super.onNewIntent(intent)
    setIntent(intent)
    // Recreate activity so React Native re-executes getLaunchOptions() with the new intent extras
    recreate()
  }

  override fun onDestroy() {
    if (activeInstance?.get() == this) {
      activeInstance = null
    }
    super.onDestroy()
  }

  override fun getMainComponentName(): String = "WakeMind"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
        override fun getLaunchOptions(): Bundle {
          val incomingIntent = intent
          val alarmId =
              incomingIntent?.getStringExtra(AlarmIntents.EXTRA_ALARM_ID)
                  ?.takeIf { it.isNotBlank() }
                  ?: AlarmRingtoneService.currentRingingAlarmId
                  ?: ""

          val storedAlarm =
              if (alarmId.isNotBlank()) AlarmStore(this@RingingActivity).get(alarmId) else null
          val activeAlarm = AlarmRingtoneService.currentAlarm

          val occurrenceId =
              incomingIntent?.getStringExtra(AlarmIntents.EXTRA_OCCURRENCE_ID)
                  ?: AlarmRingtoneService.currentOccurrenceId
                  ?: "${alarmId}_${System.currentTimeMillis()}"

          val rawAlarmType =
              incomingIntent?.getStringExtra(AlarmIntents.EXTRA_ALARM_TYPE)
                  ?: storedAlarm?.alarmType
                  ?: activeAlarm?.alarmType
                  ?: AlarmRingtoneService.currentAlarmType

          val rawRitualText =
              incomingIntent?.getStringExtra(AlarmIntents.EXTRA_RITUAL_TEXT)
                  ?: storedAlarm?.ritualText
                  ?: activeAlarm?.ritualText
                  ?: AlarmRingtoneService.currentRitualText

          val rawRepetitionTarget =
              incomingIntent?.getIntExtra(AlarmIntents.EXTRA_REPETITION_TARGET, -1)?.takeIf { it > 0 }
                  ?: storedAlarm?.repetitionTarget
                  ?: activeAlarm?.repetitionTarget
                  ?: AlarmRingtoneService.currentRepetitionTarget

          val isVisionRitual =
              rawAlarmType.equals(AlarmDefaults.ALARM_TYPE_VISION_RITUAL, ignoreCase = true)
                  || rawRitualText.isNotBlank()
                  || incomingIntent?.getStringExtra(AlarmIntents.EXTRA_MODE).equals(AlarmIntents.MODE_VISION_RITUAL, ignoreCase = true)

          val finalAlarmType =
              if (isVisionRitual) AlarmDefaults.ALARM_TYPE_VISION_RITUAL
              else AlarmDefaults.ALARM_TYPE_NORMAL

          val mode =
              if (isVisionRitual) AlarmIntents.MODE_VISION_RITUAL
              else AlarmIntents.MODE_ALARM

          val label =
              incomingIntent?.getStringExtra(AlarmIntents.EXTRA_LABEL)
                  ?: storedAlarm?.label
                  ?: (if (isVisionRitual) "Vision Ritual" else AlarmDefaults.DEFAULT_LABEL)
          val triggerAt =
              incomingIntent?.getLongExtra(AlarmIntents.EXTRA_TRIGGER_AT, System.currentTimeMillis())
                  ?: System.currentTimeMillis()
          val puzzleImageId =
              incomingIntent?.getStringExtra(AlarmIntents.EXTRA_PUZZLE_IMAGE_ID)
                  ?: storedAlarm?.puzzleImageId
                  ?: AlarmDefaults.DEFAULT_PUZZLE_IMAGE_ID
          val puzzleImageType =
              incomingIntent?.getStringExtra(AlarmIntents.EXTRA_PUZZLE_IMAGE_TYPE)
                  ?: storedAlarm?.puzzleImageType
                  ?: AlarmDefaults.DEFAULT_PUZZLE_IMAGE_TYPE
          val difficulty =
              incomingIntent?.getStringExtra(AlarmIntents.EXTRA_DIFFICULTY)
                  ?: storedAlarm?.difficulty
                  ?: AlarmDefaults.DIFFICULTY_EASY
          val sound =
              incomingIntent?.getStringExtra(AlarmIntents.EXTRA_SOUND)
                  ?: storedAlarm?.sound
                  ?: AlarmDefaults.DEFAULT_ALARM_SOUND_ID
          val canSnooze =
              incomingIntent?.getBooleanExtra(
                  AlarmIntents.EXTRA_CAN_SNOOZE,
                  AlarmRingtoneService.currentSnoozeCount == 0,
              ) ?: (AlarmRingtoneService.currentSnoozeCount == 0)

          return Bundle().apply {
            putString("mode", mode)
            putString("alarmId", alarmId)
            putString("occurrenceId", occurrenceId)
            putBoolean("canSnooze", canSnooze)
            putString("label", label)
            putDouble("triggerAtMillis", triggerAt.toDouble())
            putString("puzzleImageId", puzzleImageId)
            putString("puzzleImageType", puzzleImageType)
            putString("difficulty", difficulty)
            putString("sound", sound)
            putString("alarmType", finalAlarmType)
            putString("ritualText", rawRitualText)
            putInt("repetitionTarget", rawRepetitionTarget)
          }
        }
      }

  private fun showOverLockScreen() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    } else {
      @Suppress("DEPRECATION")
      window.addFlags(
          WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
              WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON,
      )
    }
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
  }

  companion object {
    private var activeInstance: WeakReference<RingingActivity>? = null

    fun finishActive() {
      try {
        activeInstance?.get()?.let { activity ->
          activity.runOnUiThread {
            if (!activity.isFinishing && !activity.isDestroyed) {
              activity.finish()
            }
          }
        }
      } catch (error: Exception) {
        Log.e(ALARM_LOG_TAG, "Could not finish ringing activity.", error)
      } finally {
        activeInstance = null
      }
    }
  }
}
