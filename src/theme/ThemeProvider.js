import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {useColorScheme} from 'react-native';
import {palettes} from '../constants/theme';
import {resolveColorScheme} from './resolveTheme';
import {
  loadThemeMode as readSavedThemeMode,
  normalizeThemeMode,
  saveThemeMode as writeSavedThemeMode,
} from './themePreference';

const ThemeContext = createContext(null);

export function ThemeProvider({
  children,
  loadThemeMode = readSavedThemeMode,
  saveThemeMode = writeSavedThemeMode,
}) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState(null);
  const modeRef = useRef(null);
  const mountedRef = useRef(true);
  modeRef.current = mode;

  useEffect(() => {
    mountedRef.current = true;
    let active = true;
    loadThemeMode()
      .then(value => {
        if (active) {
          setMode(normalizeThemeMode(value));
        }
      })
      .catch(loadError => {
        console.warn(
          'Theme preference could not be loaded. Using System.',
          loadError instanceof Error ? loadError.message : 'Unknown theme load failure.',
        );
        if (active) {
          setMode('system');
        }
      });
    return () => {
      active = false;
      mountedRef.current = false;
    };
  }, [loadThemeMode]);

  const setThemeMode = useCallback(
    async nextMode => {
      if (nextMode !== 'light' && nextMode !== 'dark' && nextMode !== 'system') {
        throw new Error('Theme mode must be system, light, or dark.');
      }
      const previous = modeRef.current;
      setMode(nextMode);
      try {
        const saved = await saveThemeMode(nextMode);
        if (mountedRef.current) {
          setMode(normalizeThemeMode(saved));
        }
      } catch (saveError) {
        if (mountedRef.current) {
          setMode(previous);
        }
        throw saveError instanceof Error
          ? saveError
          : new Error('The appearance could not be saved.');
      }
    },
    [saveThemeMode],
  );

  const value = useMemo(() => {
    const scheme = resolveColorScheme(mode, systemScheme);
    if (!scheme) {
      return {
        ready: false,
        mode,
        scheme: null,
        colors: null,
        statusBarStyle: null,
        setThemeMode,
      };
    }
    return {
      ready: true,
      mode,
      scheme,
      colors: palettes[scheme],
      statusBarStyle: scheme === 'dark' ? 'light-content' : 'dark-content',
      setThemeMode,
    };
  }, [mode, setThemeMode, systemScheme]);

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
