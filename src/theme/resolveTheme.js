export function resolveColorScheme(mode, systemScheme) {
  if (mode === 'light' || mode === 'dark') {
    return mode;
  }
  if (
    mode === 'system' &&
    (systemScheme === 'light' || systemScheme === 'dark')
  ) {
    return systemScheme;
  }
  return null;
}
