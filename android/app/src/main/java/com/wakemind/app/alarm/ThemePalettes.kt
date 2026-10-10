package com.wakemind.app.alarm

import android.content.Context
import android.content.res.Configuration

/**
 * Visual colors for the ringing screen. Keep the hex values aligned with
 * src/constants/theme.js. This object does not schedule or stop alarms.
 */
internal data class ThemePalette(
    val background: Int,
    val text: Int,
    val muted: Int,
    val accent: Int,
    val stop: Int,
    val stopText: Int,
)

internal object ThemePalettes {
  private val light =
      ThemePalette(
          background = 0xFFF4EFE6.toInt(),
          text = 0xFF1C1916.toInt(),
          muted = 0xFF6F675F.toInt(),
          accent = 0xFF44507A.toInt(),
          stop = 0xFFA33B32.toInt(),
          stopText = 0xFFF8F5F0.toInt(),
      )

  private val dark =
      ThemePalette(
          background = 0xFF14161C.toInt(),
          text = 0xFFF4F1EA.toInt(),
          muted = 0xFFA8A297.toInt(),
          accent = 0xFFCDBFEA.toInt(),
          stop = 0xFFE38B7C.toInt(),
          stopText = 0xFF221C2E.toInt(),
      )

  fun resolve(context: Context): ThemePalette {
    return when (ThemePreferences.getMode(context)) {
      ThemeModes.LIGHT -> light
      ThemeModes.DARK -> dark
      else -> if (isNight(context)) dark else light
    }
  }

  private fun isNight(context: Context): Boolean {
    val night = context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
    return night == Configuration.UI_MODE_NIGHT_YES
  }
}
