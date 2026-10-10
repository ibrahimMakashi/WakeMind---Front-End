package com.wakemind.app.alarm

internal object ThemeModes {
  const val SYSTEM = "system"
  const val LIGHT = "light"
  const val DARK = "dark"

  fun requireMode(value: String?): String {
    if (value == SYSTEM || value == LIGHT || value == DARK) {
      return value
    }
    throw IllegalArgumentException("Theme mode must be system, light, or dark.")
  }

  fun storedMode(value: String?): String {
    return if (value == SYSTEM || value == LIGHT || value == DARK) value else SYSTEM
  }
}
