import {resolveColorScheme} from './resolveTheme';
import {normalizeThemeMode} from './themePreference';

test('waits for the saved mode before choosing a palette', () => {
  expect(resolveColorScheme(null, 'dark')).toBeNull();
  expect(resolveColorScheme(null, null)).toBeNull();
  expect(resolveColorScheme(undefined, 'light')).toBeNull();
});

test('uses an explicit light or dark choice instead of the device scheme', () => {
  expect(resolveColorScheme('light', 'dark')).toBe('light');
  expect(resolveColorScheme('dark', 'light')).toBe('dark');
  expect(resolveColorScheme('light', null)).toBe('light');
  expect(resolveColorScheme('dark', null)).toBe('dark');
});

test('follows the live device scheme only while the mode is system', () => {
  expect(resolveColorScheme('system', 'light')).toBe('light');
  expect(resolveColorScheme('system', 'dark')).toBe('dark');
});

test('uses light when system mode has no device scheme yet', () => {
  expect(resolveColorScheme('system', null)).toBe('light');
  expect(resolveColorScheme('system', undefined)).toBe('light');
});

test('treats an unusable stored mode as system after the read finishes', () => {
  expect(normalizeThemeMode('light')).toBe('light');
  expect(normalizeThemeMode('dark')).toBe('dark');
  expect(normalizeThemeMode('system')).toBe('system');
  expect(normalizeThemeMode('sepia')).toBe('system');
  expect(normalizeThemeMode(undefined)).toBe('system');
});
