import {NativeModules, Platform} from 'react-native';

const THEME_MODES = ['system', 'light', 'dark'];

export function normalizeThemeMode(value) {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }
  return 'system';
}

function themeModule() {
  if (Platform.OS !== 'android') {
    return null;
  }
  const nativeModule = NativeModules.AlarmModule;
  if (!nativeModule || typeof nativeModule.getThemeMode !== 'function') {
    return null;
  }
  return nativeModule;
}

function errorMessage(error, fallback) {
  if (error && typeof error.message === 'string' && error.message) {
    return error.message;
  }
  return fallback;
}

export async function loadThemeMode() {
  const nativeModule = themeModule();
  if (!nativeModule) {
    return 'system';
  }
  try {
    const stored = await nativeModule.getThemeMode();
    return normalizeThemeMode(stored);
  } catch (readError) {
    console.warn(
      'Theme preference could not be read. Using System.',
      errorMessage(readError, 'Unknown theme read failure.'),
    );
    return 'system';
  }
}

export async function saveThemeMode(mode) {
  if (!THEME_MODES.includes(mode)) {
    throw new Error('Theme mode must be system, light, or dark.');
  }
  const nativeModule = themeModule();
  if (!nativeModule || typeof nativeModule.setThemeMode !== 'function') {
    return mode;
  }
  try {
    const saved = await nativeModule.setThemeMode(mode);
    return normalizeThemeMode(saved);
  } catch (writeError) {
    throw new Error(
      errorMessage(writeError, 'The appearance could not be saved.'),
    );
  }
}
