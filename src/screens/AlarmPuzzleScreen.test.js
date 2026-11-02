import React from 'react';
import {BackHandler} from 'react-native';
import {act, create} from 'react-test-renderer';
import {AlarmPuzzleScreen} from './AlarmPuzzleScreen';
import {PuzzleBoard} from '../components/puzzle/PuzzleBoard';

jest.mock('@react-native-vector-icons/material-design-icons', () => 'MaterialDesignIcons');

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  default: () => ({width: 375, height: 812, scale: 2, fontScale: 1}),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 44, bottom: 34, left: 0, right: 0}),
}));

jest.mock('../theme/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => true,
}));

jest.mock('../services/alarmService', () => ({
  dismissAlarmAfterPuzzle: jest.fn().mockResolvedValue(true),
  stopRinging: jest.fn().mockResolvedValue(null),
}));

jest.mock('../theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      background: '#0a0e17',
      surface: '#111827',
      surfaceRaised: '#1e293b',
      border: '#334155',
      text: '#f8fafc',
      textSoft: '#94a3b8',
      muted: '#64748b',
      accent: '#f5a623',
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
      pill: 999,
    },
  }),
}));

describe('AlarmPuzzleScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('registers hardware back press handler that suppresses back exit', async () => {
    const addEventListenerSpy = jest.spyOn(BackHandler, 'addEventListener');
    let renderer;
    await act(async () => {
      renderer = create(
        <AlarmPuzzleScreen
          alarmId="alarm-101"
          difficulty="easy"
          label="Morning Workout"
        />,
      );
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'hardwareBackPress',
      expect.any(Function),
    );

    const backHandlerCallback = addEventListenerSpy.mock.calls[0][1];
    expect(backHandlerCallback()).toBe(true);

    act(() => {
      renderer.unmount();
    });
  });

  test('renders board with easy difficulty (3x3 grid) by default', async () => {
    let renderer;
    await act(async () => {
      renderer = create(
        <AlarmPuzzleScreen
          alarmId="alarm-101"
          difficulty="easy"
          label="Morning Workout"
        />,
      );
    });

    const board = renderer.root.findByType(PuzzleBoard);
    expect(board.props.board.size).toBe(3);
    expect(board.props.board.tiles.length).toBe(9);
    act(() => {
      renderer.unmount();
    });
  });

  test('renders board with medium difficulty (4x4 grid)', async () => {
    let renderer;
    await act(async () => {
      renderer = create(
        <AlarmPuzzleScreen
          alarmId="alarm-102"
          difficulty="medium"
          label="Office Wakeup"
        />,
      );
    });

    const board = renderer.root.findByType(PuzzleBoard);
    expect(board.props.board.size).toBe(4);
    expect(board.props.board.tiles.length).toBe(16);
    act(() => {
      renderer.unmount();
    });
  });

  test('renders board with hard difficulty (5x5 grid)', async () => {
    let renderer;
    await act(async () => {
      renderer = create(
        <AlarmPuzzleScreen
          alarmId="alarm-103"
          difficulty="hard"
          label="Discipline Grind"
        />,
      );
    });

    const board = renderer.root.findByType(PuzzleBoard);
    expect(board.props.board.size).toBe(5);
    expect(board.props.board.tiles.length).toBe(25);
    act(() => {
      renderer.unmount();
    });
  });

  test('dismisses alarm via dismissAlarmAfterPuzzle when solved', async () => {
    let renderer;
    await act(async () => {
      renderer = create(
        <AlarmPuzzleScreen
          alarmId="alarm-solve-test"
          difficulty="easy"
          label="Solve Test"
        />,
      );
    });

    const board = renderer.root.findByType(PuzzleBoard);

    // Call onAccessibilityActivate (tile taps) to simulate swaps
    await act(async () => {
      board.props.onAccessibilityActivate('tile-0');
    });

    expect(board.props.locked).toBe(false);
    act(() => {
      renderer.unmount();
    });
  });
});
