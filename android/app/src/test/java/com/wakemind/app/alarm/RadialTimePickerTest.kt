package com.wakemind.app.alarm

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class RadialTimePickerTest {
  @Test
  fun rejectsPickerPresentationWhenStateIsSaved() {
    assertEquals(PickerPresentation.REJECT_STATE_SAVED, presentationFor(true))
  }

  @Test
  fun usesNormalShowWhenTheActivityCanCommit() {
    assertEquals(PickerPresentation.SHOW, presentationFor(false))
  }

  @Test
  fun settlesAPickerResultAtMostOnce() {
    val settlement = SingleSettlement()
    assertTrue(settlement.claim())
    assertFalse(settlement.claim())
  }

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
