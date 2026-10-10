import {act, create} from 'react-test-renderer';
import {Text} from 'react-native';
import {ThemeProvider, useTheme} from './ThemeProvider';

function Probe() {
  const theme = useTheme();
  return (
    <Text
      onPress={() => theme.setThemeMode('dark')}
      testID="theme">
      {theme.ready ? `${theme.mode}:${theme.scheme}` : 'loading'}
    </Text>
  );
}

function textOf(renderer) {
  return renderer.root.findByType(Text).props.children;
}

test('does not render a resolved theme before the saved mode loads', async () => {
  let resolveMode;
  const loadThemeMode = () =>
    new Promise(resolve => {
      resolveMode = resolve;
    });
  let renderer;
  await act(async () => {
    renderer = create(
      <ThemeProvider loadThemeMode={loadThemeMode}>
        <Probe />
      </ThemeProvider>,
    );
  });

  expect(textOf(renderer)).toBe('loading');

  await act(async () => {
    resolveMode('dark');
  });

  expect(textOf(renderer)).toBe('dark:dark');
});

test('resolves each explicit mode after the preference loads', async () => {
  let renderer;
  await act(async () => {
    renderer = create(
      <ThemeProvider loadThemeMode={async () => 'light'}>
        <Probe />
      </ThemeProvider>,
    );
  });
  expect(textOf(renderer)).toBe('light:light');
});

test('keeps the previous mode when saving the new one fails', async () => {
  const saveThemeMode = jest.fn(async () => {
    throw new Error('disk full');
  });
  let renderer;
  await act(async () => {
    renderer = create(
      <ThemeProvider
        loadThemeMode={async () => 'system'}
        saveThemeMode={saveThemeMode}>
        <Probe />
      </ThemeProvider>,
    );
  });

  await act(async () => {
    await expect(renderer.root.findByType(Text).props.onPress()).rejects.toThrow(
      'disk full',
    );
  });

  expect(saveThemeMode).toHaveBeenCalledWith('dark');
  expect(textOf(renderer)).toMatch(/^system:/);
});

test('persists a selected mode and shows it immediately', async () => {
  const saveThemeMode = jest.fn(async mode => mode);
  let renderer;
  await act(async () => {
    renderer = create(
      <ThemeProvider
        loadThemeMode={async () => 'system'}
        saveThemeMode={saveThemeMode}>
        <Probe />
      </ThemeProvider>,
    );
  });

  await act(async () => {
    await renderer.root.findByType(Text).props.onPress();
  });

  expect(saveThemeMode).toHaveBeenCalledWith('dark');
  expect(textOf(renderer)).toBe('dark:dark');
});
