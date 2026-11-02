import React from 'react';
import {act, create} from 'react-test-renderer';
import {PuzzleScreen} from './PuzzleScreen';
import {PuzzleBoard} from '../components/puzzle/PuzzleBoard';
import {PuzzleHud} from '../components/puzzle/PuzzleHud';
import {cellCenter, cellOrigin} from '../puzzle/layout';

jest.mock('@react-native-vector-icons/material-design-icons', () => 'MaterialDesignIcons');

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  default: () => ({width: 375, height: 812, scale: 2, fontScale: 1}),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({goBack: jest.fn()}),
  useRoute: () => ({params: {}}),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

jest.mock('../theme/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => true,
}));

jest.mock('../theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      background: '#0a0e17',
      surfaceDeep: '#0f172a',
      border: '#1e293b',
      text: '#f8fafc',
      textSoft: '#94a3b8',
      accent: '#f59e0b',
    },
    typography: {
      bodyStrong: {},
      screenTitle: {},
    },
    radius: {
      sm: 4,
      md: 8,
      lg: 12,
      pill: 999,
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
    },
  }),
}));

let gestureTime = 1000;
function makeGestureEvent(currentX, currentY, prevX = currentX, prevY = currentY) {
  gestureTime += 16;
  const touch = {
    touchActive: true,
    startPageX: prevX,
    startPageY: prevY,
    previousPageX: prevX,
    previousPageY: prevY,
    currentPageX: currentX,
    currentPageY: currentY,
    currentTimeStamp: gestureTime,
  };
  return {
    nativeEvent: {
      pageX: currentX,
      pageY: currentY,
      touches: [{pageX: currentX, pageY: currentY, identifier: 0}],
      changedTouches: [{pageX: currentX, pageY: currentY, identifier: 0}],
    },
    touchHistory: {
      touchBank: [touch],
      numberActiveTouches: 1,
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: gestureTime,
    },
  };
}

describe('PuzzleScreen lifecycle & drag regression tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    gestureTime = 1000;
  });

  afterEach(() => {
    act(() => {
      jest.runAllTimers();
    });
    jest.useRealTimers();
  });

  test('re-rendering PuzzleScreen preserves tile drag offset and does not reset it to zero', async () => {
    let renderer;
    await act(async () => {
      renderer = create(<PuzzleScreen />);
    });
    // Allow initial mount scramble to finish so phase returns to 'idle'
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        jest.advanceTimersByTime(100);
      });
    }

    const boardComponent = renderer.root.findByType(PuzzleBoard);
    const {panHandlers, layout, getMotion, board: currentBoard} = boardComponent.props;
    const tileAt0 = currentBoard.tiles.find(t => t.position === 0);
    const center = cellCenter(0, layout);

    // Grant gesture on whichever tile is currently in cell 0
    await act(async () => {
      panHandlers.onResponderGrant(
        makeGestureEvent(center.x, center.y, center.x, center.y),
      );
    });

    // Move tile by 40px, 25px
    await act(async () => {
      panHandlers.onResponderMove(
        makeGestureEvent(center.x + 40, center.y + 25, center.x, center.y),
      );
    });

    const activeMotion = getMotion(tileAt0.id);
    expect(activeMotion.drag.x._value).toBe(40);
    expect(activeMotion.drag.y._value).toBe(25);

    // Capture animated value references
    const originalDragInstance = activeMotion.drag;
    const originalPosInstance = activeMotion.position;

    // Trigger ordinary re-renders of the screen (e.g. from state update, theme, HUD)
    await act(async () => {
      renderer.update(<PuzzleScreen />);
    });

    // The tile's Animated.Value instances must be the exact same instances
    expect(activeMotion.drag).toBe(originalDragInstance);
    expect(activeMotion.position).toBe(originalPosInstance);

    // Crucial regression verification: drag values MUST NOT be reset to 0
    expect(activeMotion.drag.x._value).toBe(40);
    expect(activeMotion.drag.y._value).toBe(25);

    // Move further: must follow continuously from 40, 25 to 60, 35
    await act(async () => {
      panHandlers.onResponderMove(
        makeGestureEvent(center.x + 60, center.y + 35, center.x + 40, center.y + 25),
      );
    });

    expect(activeMotion.drag.x._value).toBe(60);
    expect(activeMotion.drag.y._value).toBe(35);
  });

  test('changing hoverId and draggingId does not reset the tile drag offset', async () => {
    let renderer;
    await act(async () => {
      renderer = create(<PuzzleScreen />);
    });
    // Allow initial mount scramble to finish so phase returns to 'idle'
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        jest.advanceTimersByTime(100);
      });
    }

    const boardComponent = renderer.root.findByType(PuzzleBoard);
    const {panHandlers, layout, getMotion, board: currentBoard} = boardComponent.props;
    const tileAt0 = currentBoard.tiles.find(t => t.position === 0);
    const tileAt1 = currentBoard.tiles.find(t => t.position === 1);
    const center = cellCenter(0, layout);

    await act(async () => {
      panHandlers.onResponderGrant(
        makeGestureEvent(center.x, center.y, center.x, center.y),
      );
    });

    const activeMotion = getMotion(tileAt0.id);

    // Move across tiles to trigger hover change to cell 1
    await act(async () => {
      panHandlers.onResponderMove(
        makeGestureEvent(center.x + 100, center.y, center.x, center.y),
      );
    });

    // Hover is now on the tile at cell 1, re-rendering with new hoverId
    expect(renderer.root.findByType(PuzzleBoard).props.hoverId).toBe(tileAt1.id);
    expect(activeMotion.drag.x._value).toBe(100);
    expect(activeMotion.drag.y._value).toBe(0);

    // Move back over self -> hover clears to null
    await act(async () => {
      panHandlers.onResponderMove(
        makeGestureEvent(center.x + 10, center.y, center.x + 100, center.y),
      );
    });

    expect(renderer.root.findByType(PuzzleBoard).props.hoverId).toBeNull();
    // Offset must still be exactly 10, 0
    expect(activeMotion.drag.x._value).toBe(10);
    expect(activeMotion.drag.y._value).toBe(0);
  });

  test('switching difficulty cleanly lays out all tiles with the new grid dimensions and coordinates', async () => {
    let renderer;
    await act(async () => {
      renderer = create(<PuzzleScreen />);
    });
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        jest.advanceTimersByTime(100);
      });
    }

    // Switch from easy (3x3) to medium (4x4)
    const hud = renderer.root.findByType(PuzzleHud);
    await act(async () => {
      hud.props.onSelectDifficulty('medium');
    });

    for (let i = 0; i < 15; i++) {
      await act(async () => {
        jest.advanceTimersByTime(100);
      });
    }

    const boardComponent = renderer.root.findByType(PuzzleBoard);
    const {board: mediumBoard, layout: mediumLayout, getMotion} = boardComponent.props;

    expect(mediumBoard.size).toBe(4);
    expect(mediumBoard.tiles.length).toBe(16);

    // Verify each tile is correctly placed at its 4x4 cell origin
    mediumBoard.tiles.forEach(tile => {
      const motion = getMotion(tile.id);
      const expectedOrigin = cellOrigin(tile.position, mediumLayout);
      expect(motion.position.x._value).toBeCloseTo(expectedOrigin.x, 1);
      expect(motion.position.y._value).toBeCloseTo(expectedOrigin.y, 1);
    });
  });
});
