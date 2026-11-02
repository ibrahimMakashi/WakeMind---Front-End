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
          val alarmId = intent?.getStringExtra(AlarmIntents.EXTRA_ALARM_ID) ?: ""
          val label =
              intent?.getStringExtra(AlarmIntents.EXTRA_LABEL) ?: AlarmDefaults.DEFAULT_LABEL
          val triggerAt =
              intent?.getLongExtra(AlarmIntents.EXTRA_TRIGGER_AT, System.currentTimeMillis())
                  ?: System.currentTimeMillis()
          val puzzleImageId =
              intent?.getStringExtra(AlarmIntents.EXTRA_PUZZLE_IMAGE_ID)
                  ?: AlarmDefaults.DEFAULT_PUZZLE_IMAGE_ID
          val puzzleImageType =
              intent?.getStringExtra(AlarmIntents.EXTRA_PUZZLE_IMAGE_TYPE)
                  ?: AlarmDefaults.DEFAULT_PUZZLE_IMAGE_TYPE
          val difficulty =
              intent?.getStringExtra(AlarmIntents.EXTRA_DIFFICULTY)
                  ?: AlarmDefaults.DIFFICULTY_EASY

          return Bundle().apply {
            putString("mode", AlarmIntents.MODE_ALARM)
            putString("alarmId", alarmId)
            putString("label", label)
            putDouble("triggerAtMillis", triggerAt.toDouble())
            putString("puzzleImageId", puzzleImageId)
            putString("puzzleImageType", puzzleImageType)
            putString("difficulty", difficulty)
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
