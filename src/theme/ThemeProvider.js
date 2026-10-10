import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {useColorScheme} from 'react-native';
import {palettes} from '../constants/theme';
import {resolveColorScheme} from './resolveTheme';
import {
  loadThemeMode as readSavedThemeMode,
  normalizeThemeMode,
} from './themePreference';

const ThemeContext = createContext(null);

export function ThemeProvider({
  children,
  loadThemeMode = readSavedThemeMode,
}) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState(null);

  useEffect(() => {
    let active = true;
    loadThemeMode()
      .then(value => {
        if (active) {
          setMode(normalizeThemeMode(value));
        }
      })
      .catch(() => {
        if (active) {
          setMode('system');
        }
      });
    return () => {
      active = false;
    };
  }, [loadThemeMode]);

  const value = useMemo(() => {
    const scheme = resolveColorScheme(mode, systemScheme);
    if (!scheme) {
      return {
        ready: false,
        mode,
        scheme: null,
        colors: null,
        statusBarStyle: null,
      };
    }
    return {
      ready: true,
      mode,
      scheme,
      colors: palettes[scheme],
      statusBarStyle: scheme === 'dark' ? 'light-content' : 'dark-content',
    };
  }, [mode, systemScheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within ThemeProvider.');
  }
  return theme;
}
