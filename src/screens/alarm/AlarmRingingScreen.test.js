import React from 'react';
import {BackHandler} from 'react-native';
import {act, create} from 'react-test-renderer';
import {AlarmRingingScreen} from './AlarmRingingScreen';
import {MissionActiveScreen} from './MissionActiveScreen';
import {MissionCompletionScreen} from './MissionCompletionScreen';
import {AlarmPuzzleScreen} from '../AlarmPuzzleScreen';
import * as alarmService from '../../services/alarmService';

jest.mock('@react-native-vector-icons/material-design-icons', () => 'MaterialDesignIcons');

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  default: () => ({width: 375, height: 812, scale: 2, fontScale: 1}),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 44, bottom: 34, left: 0, right: 0}),
}));

jest.mock('../../theme/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => true,
}));

jest.mock('../../services/alarmService', () => ({
  canSnoozeAlarm: jest.fn().mockResolvedValue(true),
  snoozeAlarm: jest.fn().mockResolvedValue(true),
  dismissAlarmAfterPuzzle: jest.fn().mockResolvedValue(true),
  stopRinging: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      background: '#070C16',
      surface: '#0E1420',
      surfaceRaised: '#121927',
      card: '#121927',
      cardBorder: '#1E293B',
      border: '#1E293B',
      borderSubtle: '#243046',
      text: '#FFFFFF',
      textSoft: '#E2E8F0',
      textSubtle: '#94A3B8',
      muted: '#64748B',
      accent: '#FFB84D',
      accentText: '#070C16',
      error: '#E06B7A',
    },
    typography: {
      caption: {},
      heroTime: {},
      cardHeading: {},
    },
    radius: {
      sm: 4,
      md: 8,
      lg: 12,
      card: 20,
      pill: 999,
    },
  }),
}));

describe('AlarmRingingScreen Flow', () => {
  const baseProps = {
    alarmId: 'alarm-test-1',
    occurrenceId: 'occ-test-1_12345678',
    canSnooze: true,
    label: 'Hardcore Leg Day',
    triggerAtMillis: 1700000000000,
    difficulty: 'easy',
    sound: 'gentle_morning',
  };

  let activeRenderer = null;

  beforeEach(() => {
    jest.clearAllMocks();
    activeRenderer = null;
  });

  afterEach(() => {
    if (activeRenderer) {
      act(() => {
        activeRenderer.unmount();
      });
      activeRenderer = null;
    }
  });

  test('initial stage is MissionActiveScreen, does not immediately open puzzle', async () => {
    await act(async () => {
      activeRenderer = create(<AlarmRingingScreen {...baseProps} />);
    });

    const missionScreen = activeRenderer.root.findByType(MissionActiveScreen);
    expect(missionScreen).toBeDefined();
    expect(missionScreen.props.occurrenceId).toBe('occ-test-1_12345678');
    expect(missionScreen.props.alarmId).toBe('alarm-test-1');

    // Puzzle screen is NOT rendered yet
    expect(activeRenderer.root.findAllByType(AlarmPuzzleScreen)).toHaveLength(0);
    // Completion screen is NOT rendered yet
    expect(activeRenderer.root.findAllByType(MissionCompletionScreen)).toHaveLength(0);
  });

  test('hardware back press is suppressed and does not dismiss alarm', async () => {
    const addEventListenerSpy = jest.spyOn(BackHandler, 'addEventListener');
    await act(async () => {
      activeRenderer = create(<AlarmRingingScreen {...baseProps} />);
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'hardwareBackPress',
      expect.any(Function),
    );
    const backCallback = addEventListenerSpy.mock.calls[0][1];
    expect(backCallback()).toBe(true);
    expect(alarmService.dismissAlarmAfterPuzzle).not.toHaveBeenCalled();
  });

  test('tapping START WAKE MISSION transitions from Mission Active to PuzzleScreen', async () => {
    await act(async () => {
      activeRenderer = create(<AlarmRingingScreen {...baseProps} />);
    });

    const missionScreen = activeRenderer.root.findByType(MissionActiveScreen);

    // Trigger onStartMission
    await act(async () => {
      missionScreen.props.onStartMission();
    });

    // Now AlarmPuzzleScreen is rendered with the exact same occurrenceId
    const puzzleScreen = activeRenderer.root.findByType(AlarmPuzzleScreen);
    expect(puzzleScreen).toBeDefined();
    expect(puzzleScreen.props.occurrenceId).toBe('occ-test-1_12345678');
    expect(puzzleScreen.props.alarmId).toBe('alarm-test-1');

    // MissionActiveScreen is no longer active
    expect(activeRenderer.root.findAllByType(MissionActiveScreen)).toHaveLength(0);
  });

  test('puzzle success transitions to CompletionScreen and DOES NOT dismiss alarm', async () => {
    await act(async () => {
      activeRenderer = create(<AlarmRingingScreen {...baseProps} />);
    });

    // Start mission
    await act(async () => {
      activeRenderer.root.findByType(MissionActiveScreen).props.onStartMission();
    });

    const puzzleScreen = activeRenderer.root.findByType(AlarmPuzzleScreen);
    expect(puzzleScreen.props.onSolved).toBeDefined();

    // Trigger puzzle solved
    await act(async () => {
      puzzleScreen.props.onSolved('alarm-test-1', 'occ-test-1_12345678');
    });

    // CRITICAL REQUIREMENT: Native dismiss must NOT have been called yet!
    expect(alarmService.dismissAlarmAfterPuzzle).not.toHaveBeenCalled();

    // MissionCompletionScreen is now visible
    const completionScreen = activeRenderer.root.findByType(MissionCompletionScreen);
    expect(completionScreen).toBeDefined();
    expect(completionScreen.props.occurrenceId).toBe('occ-test-1_12345678');
    expect(completionScreen.props.alarmId).toBe('alarm-test-1');
  });

  test('tapping final CTA on CompletionScreen dismisses alarm via dismissAlarmAfterPuzzle with occurrenceId', async () => {
    await act(async () => {
      activeRenderer = create(<AlarmRingingScreen {...baseProps} />);
    });

    // 1. Mission -> Puzzle
    await act(async () => {
      activeRenderer.root.findByType(MissionActiveScreen).props.onStartMission();
    });

    // 2. Puzzle -> Completion
    await act(async () => {
      activeRenderer.root.findByType(AlarmPuzzleScreen).props.onSolved('alarm-test-1', 'occ-test-1_12345678');
    });

    expect(alarmService.dismissAlarmAfterPuzzle).not.toHaveBeenCalled();

    // 3. User explicitly acknowledges completion
    const completionScreen = activeRenderer.root.findByType(MissionCompletionScreen);
    await act(async () => {
      completionScreen.props.onDismiss();
    });

    expect(alarmService.dismissAlarmAfterPuzzle).toHaveBeenCalledTimes(1);
    expect(alarmService.dismissAlarmAfterPuzzle).toHaveBeenCalledWith(
      'alarm-test-1',
      'occ-test-1_12345678',
    );
  });

  test('double tap protection: multiple onDismiss calls only execute dismiss once', async () => {
    await act(async () => {
      activeRenderer = create(<AlarmRingingScreen {...baseProps} />);
    });

    await act(async () => {
      activeRenderer.root.findByType(MissionActiveScreen).props.onStartMission();
    });
    await act(async () => {
      activeRenderer.root.findByType(AlarmPuzzleScreen).props.onSolved('alarm-test-1', 'occ-test-1_12345678');
    });

    const completionScreen = activeRenderer.root.findByType(MissionCompletionScreen);

    // Rapid double tap
    await act(async () => {
      completionScreen.props.onDismiss();
      completionScreen.props.onDismiss();
    });

    expect(alarmService.dismissAlarmAfterPuzzle).toHaveBeenCalledTimes(1);
  });

  test('snooze button invokes native snoozeAlarm with occurrenceId', async () => {
    await act(async () => {
      activeRenderer = create(<AlarmRingingScreen {...baseProps} />);
    });

    const missionScreen = activeRenderer.root.findByType(MissionActiveScreen);
    await act(async () => {
      missionScreen.props.onSnooze();
    });

    expect(alarmService.snoozeAlarm).toHaveBeenCalledWith('alarm-test-1', 'occ-test-1_12345678');
  });
});
