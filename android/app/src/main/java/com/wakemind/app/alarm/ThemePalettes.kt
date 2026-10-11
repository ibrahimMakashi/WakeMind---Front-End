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
          background = 0xFFE8ECF5.toInt(),
          text = 0xFF0B1020.toInt(),
          muted = 0xFF626B7D.toInt(),
          accent = 0xFFE5A035.toInt(),
          stop = 0xFFB8434F.toInt(),
          stopText = 0xFFFFFFFF.toInt(),
      )

  private val dark =
      ThemePalette(
          background = 0xFF0B1020.toInt(),
          text = 0xFFF1F3FF.toInt(),
          muted = 0xFF626B7D.toInt(),
          accent = 0xFFFFB84D.toInt(),
          stop = 0xFFE06B7A.toInt(),
          stopText = 0xFFFFFFFF.toInt(),
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
