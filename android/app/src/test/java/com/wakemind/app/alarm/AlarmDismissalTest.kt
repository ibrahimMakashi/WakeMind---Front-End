package com.wakemind.app.alarm

import android.content.ContextWrapper
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Test

class AlarmDismissalTest {

  @Test
  fun blankAlarmIdThrowsValidationException() {
    val context = ContextWrapper(null)
    assertThrows(IllegalArgumentException::class.java) {
      AlarmRingtoneService.dismissAfterPuzzle(context, "   ", "occ-1")
    }
  }

  @Test
  fun blankOccurrenceIdThrowsValidationException() {
    val context = ContextWrapper(null)
    assertThrows(IllegalArgumentException::class.java) {
      AlarmRingtoneService.dismissAfterPuzzle(context, "alarm-1", "   ")
    }
  }

  @Test
  fun whenNotRingingReturnsFalse() {
    val context = ContextWrapper(null)
    AlarmRingtoneService.isRinging = false
    AlarmRingtoneService.currentRingingAlarmId = null
    AlarmRingtoneService.currentOccurrenceId = null
    val result = AlarmRingtoneService.dismissAfterPuzzle(context, "alarm-123", "occ-123")
    assertFalse(result)
  }

  @Test
  fun whenRingingMismatchIdReturnsFalse() {
    val context = ContextWrapper(null)
    AlarmRingtoneService.isRinging = true
    AlarmRingtoneService.currentRingingAlarmId = "alarm-active"
    AlarmRingtoneService.currentOccurrenceId = "occ-active"
    val result = AlarmRingtoneService.dismissAfterPuzzle(context, "alarm-other", "occ-active")
    assertFalse(result)
  }

  @Test
  fun whenRingingMismatchOccurrenceReturnsFalse() {
    val context = ContextWrapper(null)
    AlarmRingtoneService.isRinging = true
    AlarmRingtoneService.currentRingingAlarmId = "alarm-active"
    AlarmRingtoneService.currentOccurrenceId = "occ-active"
    val result = AlarmRingtoneService.dismissAfterPuzzle(context, "alarm-active", "occ-other")
    assertFalse(result)
  }
}
