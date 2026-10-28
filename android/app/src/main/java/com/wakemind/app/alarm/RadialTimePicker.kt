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

internal enum class PickerPresentation {
  /** DialogFragment.show() while the activity can still commit fragments. */
  SHOW,
  /** State is already saved. Do not call show() or showNow(). */
  REJECT_STATE_SAVED,
}

internal class SingleSettlement {
  private val settled = AtomicBoolean(false)

  fun claim(): Boolean = settled.compareAndSet(false, true)
}

/**
 * showNow() uses commitNow() and throws IllegalStateException after
 * onSaveInstanceState. A saved state must reject the request instead.
 */
internal fun presentationFor(stateSaved: Boolean): PickerPresentation {
  return if (stateSaved) {
    PickerPresentation.REJECT_STATE_SAVED
  } else {
    PickerPresentation.SHOW
  }
}

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

    val settlement = SingleSettlement()
    fun resolveCancel() {
      if (!settlement.claim()) {
        return
      }
      promise.resolve(cancelledMap())
    }

    fun resolveSet(hour: Int, selectedMinute: Int) {
      if (!settlement.claim()) {
        return
      }
      val map = Arguments.createMap()
      map.putString("action", "set")
      map.putInt("hour", hour)
      map.putInt("minute", selectedMinute)
      promise.resolve(map)
    }

    fun rejectOnce(code: String, message: String, error: Throwable? = null) {
      if (!settlement.claim()) {
        return
      }
      if (error == null) {
        promise.reject(code, message)
      } else {
        promise.reject(code, message, error)
      }
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
    picker.addOnDismissListener { resolveCancel() }

    activity.window.decorView.post {
      if (activity.isFinishing || activity.isDestroyed) {
        rejectOnce("TIME_PICKER_UNAVAILABLE", "The app activity is not available.")
        return@post
      }
      try {
        if (!showSafely(activity, picker)) {
          Log.w(TAG, "Time picker was not shown because the activity state is already saved.")
          rejectOnce(
              "TIME_PICKER_UNAVAILABLE",
              "The time picker cannot open while the screen is pausing.",
          )
        }
      } catch (error: Exception) {
        Log.e(TAG, "Could not open the time picker.", error)
        rejectOnce(
            "TIME_PICKER_FAILED",
            error.message ?: "The time picker could not open.",
            error,
        )
      }
    }
  }

  private fun showSafely(activity: FragmentActivity, picker: MaterialTimePicker): Boolean {
    val manager = activity.supportFragmentManager
    if (presentationFor(manager.isStateSaved) != PickerPresentation.SHOW) {
      return false
    }
    val existing = manager.findFragmentByTag(FRAGMENT_TAG)
    if (existing is DialogFragment && existing.isAdded) {
      existing.dismiss()
    }
    manager.executePendingTransactions()
    if (presentationFor(manager.isStateSaved) != PickerPresentation.SHOW) {
      return false
    }
    picker.show(manager, FRAGMENT_TAG)
    return true
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
