package com.wakemind.app.alarm

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class ThemeModesTest {
  @Test
  fun acceptsTheThreeThemeModes() {
    assertEquals(ThemeModes.SYSTEM, ThemeModes.requireMode("system"))
    assertEquals(ThemeModes.LIGHT, ThemeModes.requireMode("light"))
    assertEquals(ThemeModes.DARK, ThemeModes.requireMode("dark"))
  }

  @Test
  fun rejectsAnUnknownThemeMode() {
    assertThrows(IllegalArgumentException::class.java) { ThemeModes.requireMode("sepia") }
    assertThrows(IllegalArgumentException::class.java) { ThemeModes.requireMode(null) }
  }

  @Test
  fun fallsBackWhenAStoredThemeModeIsUnusable() {
    assertEquals(ThemeModes.SYSTEM, ThemeModes.storedMode(null))
    assertEquals(ThemeModes.SYSTEM, ThemeModes.storedMode("sepia"))
    assertEquals(ThemeModes.DARK, ThemeModes.storedMode("dark"))
  }
}
