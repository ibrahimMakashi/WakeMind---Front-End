package com.wakemind.app.alarm

import android.content.res.ColorStateList
import android.graphics.drawable.ColorDrawable
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.wakemind.app.R
import java.util.Calendar
import java.util.Locale

class RingingActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    showOverLockScreen()
    applyTheme()
    setContentView(R.layout.activity_ringing)
    applyTheme()
    onBackPressedDispatcher.addCallback(
        this,
        object : OnBackPressedCallback(true) {
          override fun handleOnBackPressed() {
            stopAndFinish()
          }
        },
    )
    findViewById<Button>(R.id.stopButton).setOnClickListener { stopAndFinish() }
    bind(intent)
  }

  override fun onNewIntent(intent: android.content.Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    bind(intent)
  }

  private fun bind(source: android.content.Intent) {
    val triggerAt = source.getLongExtra(AlarmIntents.EXTRA_TRIGGER_AT, System.currentTimeMillis())
    val label = source.getStringExtra(AlarmIntents.EXTRA_LABEL) ?: "Time to wake up"
    findViewById<TextView>(R.id.ringingTime).text = formatTime(triggerAt)
    findViewById<TextView>(R.id.ringingLabel).text = label
    if (!AlarmRingtoneService.isRinging) {
      val alarmId = source.getStringExtra(AlarmIntents.EXTRA_ALARM_ID)
      if (!alarmId.isNullOrBlank()) {
        val restart =
            android.content.Intent(this, AlarmRingtoneService::class.java).apply {
              action = AlarmIntents.ACTION_START
              putExtra(AlarmIntents.EXTRA_ALARM_ID, alarmId)
              putExtra(AlarmIntents.EXTRA_LABEL, label)
              putExtra(AlarmIntents.EXTRA_VIBRATE, source.getBooleanExtra(AlarmIntents.EXTRA_VIBRATE, true))
              putExtra(AlarmIntents.EXTRA_TRIGGER_AT, triggerAt)
            }
        ContextCompat.startForegroundService(this, restart)
      }
    }
  }

  private fun applyTheme() {
    try {
      val palette = ThemePalettes.resolve(this)
      window.statusBarColor = palette.background
      window.navigationBarColor = palette.background
      window.setBackgroundDrawable(ColorDrawable(palette.background))
      val root = findViewById<View>(R.id.ringingRoot) ?: return
      root.setBackgroundColor(palette.background)
      findViewById<TextView>(R.id.ringingWordmark).setTextColor(palette.accent)
      findViewById<TextView>(R.id.ringingTime).setTextColor(palette.text)
      findViewById<TextView>(R.id.ringingLabel).setTextColor(palette.muted)
      val stop = findViewById<Button>(R.id.stopButton)
      stop.backgroundTintList = ColorStateList.valueOf(palette.stop)
      stop.setTextColor(palette.stopText)
    } catch (error: Exception) {
      Log.e(ALARM_LOG_TAG, "Could not apply the ringing theme.", error)
    }
  }

  private fun stopAndFinish() {
    AlarmRingtoneService.stop(this)
    finish()
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

  private fun formatTime(triggerAtMillis: Long): String {
    val calendar = Calendar.getInstance()
    calendar.timeInMillis = triggerAtMillis
    val hour = calendar.get(Calendar.HOUR)
    val displayHour = if (hour == 0) 12 else hour
    val minute = calendar.get(Calendar.MINUTE)
    val period = if (calendar.get(Calendar.AM_PM) == Calendar.AM) "AM" else "PM"
    return String.format(Locale.US, "%d:%02d %s", displayHour, minute, period)
  }
}
