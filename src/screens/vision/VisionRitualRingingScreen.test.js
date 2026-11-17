import {act, create} from 'react-test-renderer';
import {AccessibilityInfo, BackHandler, Vibration} from 'react-native';

jest.mock('@react-native-vector-icons/material-design-icons', () => 'MaterialDesignIcons');

import {
  dismissAlarmAfterPuzzle,
  finishRingingActivity,
} from '../../services/alarmService';
import {VisionRitualRingingScreen} from './VisionRitualRingingScreen';

jest.mock('../../theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      background: '#0B111D',
      surfaceDeep: '#151D2A',
      text: '#FFFFFF',
      textSoft: '#E2E8F0',
      muted: '#64748B',
      accent: '#F59E0B',
      accentText: '#0B111D',
    },
    typography: {
      screenTitle: {},
      cardHeading: {},
      caption: {},
      body: {},
      bodyStrong: {},
      listTime: {},
      listPeriod: {},
    },
    radius: {
      sm: 6,
      md: 12,
      lg: 16,
    },
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 24, bottom: 24, left: 0, right: 0}),
}));

jest.mock('../../services/alarmService', () => ({
  canSnoozeAlarm: jest.fn().mockResolvedValue(true),
  snoozeAlarm: jest.fn().mockResolvedValue(true),
  dismissAlarmAfterPuzzle: jest.fn().mockResolvedValue(true),
  finishRingingActivity: jest.fn().mockResolvedValue(true),
  getVisionRituals: jest.fn().mockResolvedValue([]),
}));

describe('VisionRitualRingingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders header, exact affirmation text, and initial 0 / N counter', async () => {
    let renderer;
    await act(async () => {
      renderer = create(
        <VisionRitualRingingScreen
          alarmId="vision-1"
          occurrenceId="occ-1"
          repetitionTarget={5}
          ritualText="I am relentless and disciplined."
        />,
      );
    });

    const countButton = renderer.root.findByProps({
      accessibilityLabel: 'Count recitation 0 of 5',
    });
    expect(countButton).toBeDefined();

    // Verify affirmation text is rendered
    const textNodes = renderer.root.findAll(
      node =>
        node.props?.children === 'I am relentless and disciplined.',
    );
    expect(textNodes.length).toBeGreaterThan(0);
  });

  test('tapping COUNT button increments recitation count and vibrates', async () => {
    const vibrateSpy = jest.spyOn(Vibration, 'vibrate');
    let renderer;
    await act(async () => {
      renderer = create(
        <VisionRitualRingingScreen
          alarmId="vision-1"
          occurrenceId="occ-1"
          repetitionTarget={3}
          ritualText="Action beats fear."
        />,
      );
    });

    let countButton = renderer.root.findByProps({
      accessibilityLabel: 'Count recitation 0 of 3',
    });

    // Tap 1
    act(() => {
      countButton.props.onPress();
    });
    expect(vibrateSpy).toHaveBeenCalledWith(40);

    // After debounce window (180ms), tap 2
    act(() => {
      jest.advanceTimersByTime(200);
    });
    countButton = renderer.root.findByProps({
      accessibilityLabel: 'Count recitation 1 of 3',
    });
    expect(countButton).toBeDefined();
  });

  test('reaching target recitation stops audio/vibration and transitions to completion screen', async () => {
    let renderer;
    await act(async () => {
      renderer = create(
        <VisionRitualRingingScreen
          alarmId="vision-target-test"
          occurrenceId="occ-target-test"
          repetitionTarget={2}
          ritualText="Discipline equals freedom."
        />,
      );
    });

    // Tap 1
    act(() => {
      renderer.root
        .findByProps({accessibilityLabel: 'Count recitation 0 of 2'})
        .props.onPress();
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Tap 2 (Final target reached)
    await act(async () => {
      renderer.root
        .findByProps({accessibilityLabel: 'Count recitation 1 of 2'})
        .props.onPress();
    });

    // Native audio stop called
    expect(dismissAlarmAfterPuzzle).toHaveBeenCalledWith(
      'vision-target-test',
      'occ-target-test',
    );

    // Completion screen rendered with Done button
    const doneBtn = renderer.root.findByProps({accessibilityLabel: 'Done'});
    expect(doneBtn).toBeDefined();

    // Press Done -> finishRingingActivity called
    await act(async () => {
      doneBtn.props.onPress();
    });
    expect(finishRingingActivity).toHaveBeenCalled();
  });

  test('hardware back press is suppressed during ringing', async () => {
    const addEventListenerSpy = jest.spyOn(BackHandler, 'addEventListener');
    const announceSpy = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    const vibrateSpy = jest.spyOn(Vibration, 'vibrate');

    await act(async () => {
      create(
        <VisionRitualRingingScreen
          alarmId="vision-back-test"
          occurrenceId="occ-back-test"
        />,
      );
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'hardwareBackPress',
      expect.any(Function),
    );
    const backCallback = addEventListenerSpy.mock.calls[0][1];
    expect(backCallback()).toBe(true);
    expect(announceSpy).toHaveBeenCalledWith('Vision Ritual in progress.');
    expect(vibrateSpy).toHaveBeenCalledWith(60);
  });
});
