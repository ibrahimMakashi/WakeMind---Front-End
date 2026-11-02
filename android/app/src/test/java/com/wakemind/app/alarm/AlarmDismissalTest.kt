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
      AlarmRingtoneService.dismissAfterPuzzle(context, "   ")
    }
  }

  @Test
  fun whenNotRingingReturnsFalse() {
    val context = ContextWrapper(null)
    AlarmRingtoneService.isRinging = false
    AlarmRingtoneService.currentRingingAlarmId = null
    val result = AlarmRingtoneService.dismissAfterPuzzle(context, "alarm-123")
    assertFalse(result)
  }

  @Test
  fun whenRingingMismatchIdReturnsFalse() {
    val context = ContextWrapper(null)
    AlarmRingtoneService.isRinging = true
    AlarmRingtoneService.currentRingingAlarmId = "alarm-active"
    val result = AlarmRingtoneService.dismissAfterPuzzle(context, "alarm-other")
    assertFalse(result)
  }
}
