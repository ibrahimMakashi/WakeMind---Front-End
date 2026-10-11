package com.wakemind.app.alarm

import org.junit.Assert.assertThrows
import org.junit.Test

class RadialTimePickerTest {
  @Test
  fun acceptsValidClockValues() {
    RadialTimePicker.validateClock(0, 0)
    RadialTimePicker.validateClock(23, 59)
    RadialTimePicker.validateClock(18, 30)
  }

  @Test
  fun rejectsInvalidClockValues() {
    assertThrows(IllegalArgumentException::class.java) { RadialTimePicker.validateClock(-1, 0) }
    assertThrows(IllegalArgumentException::class.java) { RadialTimePicker.validateClock(24, 0) }
    assertThrows(IllegalArgumentException::class.java) { RadialTimePicker.validateClock(6, 60) }
  }
}
