import React from 'react';
import {act, create} from 'react-test-renderer';
import {ProfileScreen} from './ProfileScreen';

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

const mockSetThemeMode = jest.fn().mockResolvedValue('light');
jest.mock('../theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      background: '#070C16',
      surface: '#0E1420',
      surfaceRaised: '#121927',
      surfaceDeep: '#151E2E',
      text: '#FFFFFF',
      textSoft: '#E2E8F0',
      textSubtle: '#94A3B8',
      muted: '#687690',
      accent: '#FFB84D',
      accentText: '#070C16',
      border: '#1E293B',
      borderSubtle: '#243046',
      success: '#4CD964',
      badgeActiveBg: 'rgba(255, 184, 77, 0.08)',
      badgeActiveBorder: 'rgba(255, 184, 77, 0.35)',
    },
    mode: 'dark',
    radius: {
      md: 16,
      icon: 12,
      badge: 12,
      sm: 10,
    },
    setThemeMode: mockSetThemeMode,
    typography: {
      brandTitle: {fontSize: 18},
      brandSubtitle: {fontSize: 11},
      sectionLabel: {fontSize: 11},
      statValue: {fontSize: 22},
      listTime: {fontSize: 34},
      body: {fontSize: 15},
      bodyStrong: {fontSize: 15, fontWeight: '700'},
      caption: {fontSize: 11},
      cardHeading: {fontSize: 11},
    },
  }),
}));

const mockAlarms = [
  {id: 'alarm-1', hour: 6, minute: 30, enabled: true, triggerAtMillis: Date.now() + 3600000, label: 'Dawn Grind'},
  {id: 'alarm-2', hour: 8, minute: 0, enabled: false, triggerAtMillis: 0, label: 'Backup'},
];

const mockReloadAlarms = jest.fn().mockResolvedValue(mockAlarms);
jest.mock('../alarms/AlarmsProvider', () => ({
  useAlarms: () => ({
    alarms: mockAlarms,
    capability: {
      exactAlarm: 'granted',
      fullScreenIntent: 'granted',
      notifications: 'granted',
    },
    loadError: '',
    busy: false,
    reload: mockReloadAlarms,
  }),
}));

const mockRituals = [
  {id: 'ritual-1', hour: 6, minute: 0, enabled: true, title: 'Deep Focus'},
];
const mockReloadRituals = jest.fn().mockResolvedValue(mockRituals);
jest.mock('../hooks/useVisionRituals', () => ({
  MAX_VISION_RITUALS: 3,
  useVisionRituals: () => ({
    rituals: mockRituals,
    reload: mockReloadRituals,
  }),
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    mockSetThemeMode.mockClear();
  });

  test('surfaces real calculated counts and overview stats', () => {
    let tree;
    act(() => {
      tree = create(<ProfileScreen />);
    });

    const root = tree.root;
    // Active alarms count card
    expect(root.findByProps({accessibilityLabel: 'Active alarms: 1'})).toBeDefined();
    // Inactive alarms count card
    expect(root.findByProps({accessibilityLabel: 'Inactive alarms: 1'})).toBeDefined();
    // Vision rituals card
    expect(
      root.findByProps({
        accessibilityLabel: 'Vision rituals: 1 of 3 configured',
      }),
    ).toBeDefined();
    // Next alarm label
    expect(root.findByProps({children: 'Dawn Grind'})).toBeDefined();
  });

  test('does NOT render developer test alarm button or card', () => {
    let tree;
    act(() => {
      tree = create(<ProfileScreen />);
    });

    const root = tree.root;
    const testAlarmBtns = root.findAllByProps({label: 'Test Alarm'});
    expect(testAlarmBtns.length).toBe(0);

    const devHeadings = root.findAllByProps({children: 'DEVELOPER'});
    expect(devHeadings.length).toBe(0);
  });

  test('renders version from package.json', () => {
    let tree;
    act(() => {
      tree = create(<ProfileScreen />);
    });

    const root = tree.root;
    expect(root.findByProps({children: 'Version 0.0.1'})).toBeDefined();
  });

  test('allows selecting appearance theme mode', async () => {
    let tree;
    act(() => {
      tree = create(<ProfileScreen />);
    });

    const lightOption = tree.root.findByProps({accessibilityLabel: 'Light'});
    await act(async () => {
      await lightOption.props.onPress();
    });

    expect(mockSetThemeMode).toHaveBeenCalledWith('light');
  });
});
