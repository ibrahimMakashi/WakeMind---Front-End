import {act, create} from 'react-test-renderer';
import {Switch} from 'react-native';
import {ThemeProvider, useTheme} from '../theme/ThemeProvider';
import {AlarmCard} from './AlarmCard';

jest.mock('@react-native-vector-icons/material-design-icons', () => 'MaterialDesignIcons');

const alarm = {
  id: 'a',
  enabled: true,
  label: 'Morning',
  hour: 6,
  minute: 30,
  vibrate: true,
};

function ReadyCard(props) {
  const theme = useTheme();
  if (!theme.ready) {
    return null;
  }
  return <AlarmCard {...props} />;
}

function editPresses(renderer) {
  return renderer.root.findAll(
    node => node.props && typeof node.props.onPress === 'function',
  );
}

async function renderCard(props) {
  let renderer;
  await act(async () => {
    renderer = create(
      <ThemeProvider loadThemeMode={async () => 'dark'}>
        <ReadyCard alarm={alarm} {...props} />
      </ThemeProvider>,
    );
  });
  return renderer;
}

test('does not open the editor while that alarm toggle is pending', async () => {
  const onEdit = jest.fn();
  const onToggle = jest.fn();
  const renderer = await renderCard({onEdit, onToggle, toggling: true});

  const presses = editPresses(renderer);
  expect(presses).toHaveLength(2);
  expect(presses.every(press => press.props.disabled)).toBe(true);
  presses.forEach(press => press.props.onPress());

  expect(onEdit).not.toHaveBeenCalled();
  expect(renderer.root.findByType(Switch).props.disabled).toBe(true);
  expect(onToggle).not.toHaveBeenCalled();
});

test('keeps edit and the switch available when the toggle is not pending', async () => {
  const onEdit = jest.fn();
  const onToggle = jest.fn();
  const renderer = await renderCard({onEdit, onToggle, toggling: false});

  const presses = editPresses(renderer);
  expect(presses).toHaveLength(2);
  presses.forEach(press => press.props.onPress());
  renderer.root.findByType(Switch).props.onValueChange(false);

  expect(onEdit).toHaveBeenCalledTimes(presses.length);
  expect(onToggle).toHaveBeenCalledWith(false);
  expect(renderer.root.findByType(Switch).props.disabled).toBe(false);
});
