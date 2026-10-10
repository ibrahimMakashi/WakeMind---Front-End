import {act, create} from 'react-test-renderer';
import {Text} from 'react-native';
import {ThemeProvider, useTheme} from './ThemeProvider';

function Probe() {
  const theme = useTheme();
  return <Text>{theme.ready ? theme.scheme : 'loading'}</Text>;
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

  expect(renderer.root.findByType(Text).props.children).toBe('loading');

  await act(async () => {
    resolveMode('dark');
  });

  expect(renderer.root.findByType(Text).props.children).toBe('dark');
});
