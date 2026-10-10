package com.wakemind.app.alarm

import android.content.Context

internal object ThemePreferences {
  const val PREFS_NAME = "wakemind-theme"
  const val KEY_MODE = "themeMode"

  fun getMode(context: Context): String {
    val stored =
        context
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString(KEY_MODE, ThemeModes.SYSTEM)
    return ThemeModes.storedMode(stored)
  }

  fun setMode(context: Context, mode: String): String {
    val valid = ThemeModes.requireMode(mode)
    val saved =
        context
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_MODE, valid)
            .commit()
    if (!saved) {
      throw IllegalStateException("Theme preference could not be saved.")
    }
    return valid
  }
}
