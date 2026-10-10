jest.mock('react-native', () => ({
  Platform: {OS: 'android'},
  NativeModules: {
    AlarmModule: {
      getThemeMode: jest.fn(),
      setThemeMode: jest.fn(),
    },
  },
}));

const {NativeModules, Platform} = require('react-native');
const {loadThemeMode, saveThemeMode} = require('./themePreference');

const nativeTheme = NativeModules.AlarmModule;

beforeEach(() => {
  Platform.OS = 'android';
  nativeTheme.getThemeMode.mockReset();
  nativeTheme.setThemeMode.mockReset();
});

test('restores a saved Android theme mode', async () => {
  nativeTheme.getThemeMode.mockResolvedValue('dark');
  await expect(loadThemeMode()).resolves.toBe('dark');
});

test('treats an invalid stored mode as system', async () => {
  nativeTheme.getThemeMode.mockResolvedValue('sepia');
  await expect(loadThemeMode()).resolves.toBe('system');
});

test('falls back to system when the theme preference cannot be read', async () => {
  nativeTheme.getThemeMode.mockRejectedValue(new Error('unreadable'));
  await expect(loadThemeMode()).resolves.toBe('system');
});

test('uses system when the native theme bridge is unavailable', async () => {
  Platform.OS = 'ios';
  await expect(loadThemeMode()).resolves.toBe('system');
  expect(nativeTheme.getThemeMode).not.toHaveBeenCalled();
});

test('persists a selected theme mode', async () => {
  nativeTheme.setThemeMode.mockResolvedValue('light');
  await expect(saveThemeMode('light')).resolves.toBe('light');
  expect(nativeTheme.setThemeMode).toHaveBeenCalledWith('light');
});

test('rejects a theme mode the app does not support', async () => {
  await expect(saveThemeMode('sepia')).rejects.toThrow(
    'Theme mode must be system, light, or dark.',
  );
  expect(nativeTheme.setThemeMode).not.toHaveBeenCalled();
});

test('reports a native failure while saving the theme', async () => {
  nativeTheme.setThemeMode.mockRejectedValue(new Error('disk full'));
  await expect(saveThemeMode('dark')).rejects.toThrow('disk full');
});
