import React from 'react';
import {act, create} from 'react-test-renderer';
import {AlarmsScreen} from './AlarmsScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useFocusEffect: callback => callback(),
}));

jest.mock('@react-native-vector-icons/material-design-icons', () => 'MaterialDesignIcons');

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 40, bottom: 20, left: 0, right: 0}),
}));

let mockAlarms = [];
const mockReload = jest.fn().mockResolvedValue([]);
const mockToggleEnabled = jest.fn().mockResolvedValue({});

jest.mock('../alarms/AlarmsProvider', () => ({
  useAlarms: () => ({
    alarms: mockAlarms,
    loadError: '',
    busy: false,
    reload: mockReload,
    toggleEnabled: mockToggleEnabled,
  }),
}));

jest.mock('../theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      background: '#070C16',
      surface: '#0E1420',
      surfaceRaised: '#121927',
      surfaceDeep: '#151E2E',
      text: '#FFFFFF',
      textSoft: '#E2E8F0',
      muted: '#687690',
      accent: '#FFB84D',
      accentText: '#070C16',
      border: '#1E293B',
      error: '#E06B7A',
    },
    typography: {
      brandTitle: {fontSize: 18},
      brandSubtitle: {fontSize: 11},
      screenTitle: {fontSize: 17, fontWeight: '700'},
      bodyStrong: {fontSize: 15, fontWeight: '700'},
      caption: {fontSize: 11},
      listTime: {fontSize: 34},
      listPeriod: {fontSize: 14},
    },
    radius: {
      md: 16,
      sm: 10,
    },
  }),
}));

describe('AlarmsScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockAlarms = [];
  });

  test('renders empty state when there are zero alarms', () => {
    mockAlarms = [];
    let tree;
    act(() => {
      tree = create(<AlarmsScreen />);
    });

    const root = tree.root;
    // Empty state title & subtitle
    expect(root.findByProps({children: 'Create Your First Alarm'})).toBeDefined();
    expect(
      root.findByProps({
        children: 'Start your discipline journey by setting your first alarm.',
      }),
    ).toBeDefined();
    expect(root.findByProps({children: '+ CREATE ALARM'})).toBeDefined();

    // Scheduled Alarms header must NOT be shown when 0 alarms exist
    const scheduledHeaders = root.findAllByProps({children: 'Scheduled Alarms'});
    expect(scheduledHeaders.length).toBe(0);
  });

  test('tapping + CREATE ALARM button navigates to Editor screen', () => {
    mockAlarms = [];
    let tree;
    act(() => {
      tree = create(<AlarmsScreen />);
    });

    const createBtn = tree.root.findByProps({accessibilityLabel: 'Create Alarm'});
    act(() => {
      createBtn.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('Editor', {alarm: null});
  });

  test('renders Scheduled Alarms header and alarm cards when alarms exist', () => {
    mockAlarms = [
      {
        id: 'alarm-1',
        hour: 6,
        minute: 30,
        enabled: true,
        label: 'Dawn Mission',
        repeatDays: ['mon', 'tue'],
        vibrate: true,
      },
    ];

    let tree;
    act(() => {
      tree = create(<AlarmsScreen />);
    });

    const root = tree.root;
    // Section title "Scheduled Alarms" must be present
    expect(root.findByProps({children: 'Scheduled Alarms'})).toBeDefined();
    expect(root.findByProps({children: '1 Configured'})).toBeDefined();

    // Empty state should NOT be present
    const emptyTitles = root.findAllByProps({children: 'Create Your First Alarm'});
    expect(emptyTitles.length).toBe(0);

    // Alarm card label
    expect(root.findByProps({children: 'Dawn Mission'})).toBeDefined();
  });

  test('does not show empty state when all existing alarms are disabled/inactive', () => {
    mockAlarms = [
      {
        id: 'alarm-inactive',
        hour: 7,
        minute: 0,
        enabled: false,
        label: 'Inactive Alarm',
        repeatDays: [],
        vibrate: false,
      },
    ];

    let tree;
    act(() => {
      tree = create(<AlarmsScreen />);
    });

    const root = tree.root;
    // Still shows Scheduled Alarms because alarms.length > 0
    expect(root.findByProps({children: 'Scheduled Alarms'})).toBeDefined();
    expect(root.findByProps({children: '1 Configured'})).toBeDefined();

    // Empty state must NOT be shown
    const emptyTitles = root.findAllByProps({children: 'Create Your First Alarm'});
    expect(emptyTitles.length).toBe(0);
  });
});
