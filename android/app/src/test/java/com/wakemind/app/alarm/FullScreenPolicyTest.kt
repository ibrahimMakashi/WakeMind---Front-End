package com.wakemind.app.alarm

import org.junit.Assert.assertEquals
import org.junit.Test

class FullScreenPolicyTest {
  @Test
  fun treatsFullScreenIntentAsGrantedBeforeAndroid14() {
    assertEquals("granted", FullScreenPolicy.decide(33, canUseFullScreenIntent = false))
  }

  @Test
  fun reportsTheAndroid14SettingWhenItIsMissing() {
    assertEquals("needsSettings", FullScreenPolicy.decide(34, canUseFullScreenIntent = false))
    assertEquals("granted", FullScreenPolicy.decide(36, canUseFullScreenIntent = true))
  }
}
