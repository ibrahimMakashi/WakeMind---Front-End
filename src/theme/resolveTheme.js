export function resolveColorScheme(mode, systemScheme) {
  if (mode == null) {
    return null;
  }
  if (mode === 'light' || mode === 'dark') {
    return mode;
  }
  if (mode === 'system') {
    if (systemScheme === 'light' || systemScheme === 'dark') {
      return systemScheme;
    }
    return 'light';
  }
  return null;
}
