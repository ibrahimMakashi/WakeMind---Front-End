package com.wakemind.app.alarm

import android.util.Log
import androidx.fragment.app.DialogFragment
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap
import com.google.android.material.timepicker.MaterialTimePicker
import com.google.android.material.timepicker.TimeFormat
import com.wakemind.app.R
import java.util.concurrent.atomic.AtomicBoolean

internal object RadialTimePicker {
  private const val TAG = "RadialTimePicker"
  private const val FRAGMENT_TAG = "WakeMindTimePicker"

  fun show(
      activity: FragmentActivity,
      hour24: Int,
      minute: Int,
      themeDark: Boolean,
      promise: Promise,
  ) {
    validateClock(hour24, minute)

    val settled = AtomicBoolean(false)
    fun resolveCancel() {
      if (!settled.compareAndSet(false, true)) {
        return
      }
      promise.resolve(cancelledMap())
    }

    fun resolveSet(hour: Int, selectedMinute: Int) {
      if (!settled.compareAndSet(false, true)) {
        return
      }
      val map = Arguments.createMap()
      map.putString("action", "set")
      map.putInt("hour", hour)
      map.putInt("minute", selectedMinute)
      promise.resolve(map)
    }

    val themeRes = if (themeDark) R.style.WakeMindTimePickerDark else R.style.WakeMindTimePickerLight
    val picker =
        MaterialTimePicker.Builder()
            .setTimeFormat(TimeFormat.CLOCK_12H)
            .setHour(hour24)
            .setMinute(minute)
            .setTheme(themeRes)
            .setTitleText("Select time")
            .build()

    picker.addOnPositiveButtonClickListener {
      resolveSet(picker.hour, picker.minute)
    }
    picker.addOnNegativeButtonClickListener { resolveCancel() }
    picker.addOnCancelListener { resolveCancel() }
    picker.addOnDismissListener {
      if (!settled.get()) {
        resolveCancel()
      }
    }

    activity.window.decorView.post {
      if (activity.isFinishing || activity.isDestroyed) {
        if (settled.compareAndSet(false, true)) {
          promise.reject("TIME_PICKER_UNAVAILABLE", "The app activity is not available.")
        }
        return@post
      }
      try {
        showSafely(activity, picker)
      } catch (error: Exception) {
        Log.e(TAG, "Could not open the time picker.", error)
        if (settled.compareAndSet(false, true)) {
          promise.reject("TIME_PICKER_FAILED", error.message, error)
        }
      }
    }
  }

  private fun showSafely(activity: FragmentActivity, picker: MaterialTimePicker) {
    val manager = activity.supportFragmentManager
    val existing = manager.findFragmentByTag(FRAGMENT_TAG)
    if (existing is DialogFragment) {
      existing.dismissAllowingStateLoss()
    }
    manager.executePendingTransactions()
    if (manager.isStateSaved) {
      picker.showNow(manager, FRAGMENT_TAG)
    } else {
      picker.show(manager, FRAGMENT_TAG)
    }
  }

  internal fun validateClock(hour24: Int, minute: Int) {
    require(hour24 in 0..23) { "Hour must be between 0 and 23." }
    require(minute in 0..59) { "Minute must be between 0 and 59." }
  }

  private fun cancelledMap(): WritableMap {
    val map = Arguments.createMap()
    map.putString("action", "dismissed")
    return map
  }
}
