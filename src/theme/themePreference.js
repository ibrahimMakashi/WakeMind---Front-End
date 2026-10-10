export function normalizeThemeMode(value) {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }
  return 'system';
}

/**
 * Phase 1 has no settings screen, so the saved mode is System.
 * The promise stays asynchronous so the app can wait for it.
 * Phase 2 replaces this body with the SharedPreferences read.
 */
export function loadThemeMode() {
  return Promise.resolve('system');
}
