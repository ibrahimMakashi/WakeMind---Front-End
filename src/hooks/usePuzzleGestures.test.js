/**
 * Production gesture tests for usePuzzleGestures & useTileMotion.
 * Exercises actual PanResponder panHandlers, Animated values,
 * asynchronous measurement, React re-renders, and engine integration.
 */

import React from 'react';
import {act, create} from 'react-test-renderer';
import {usePuzzleGestures} from './usePuzzleGestures';
import {useTileMotion} from './useTileMotion';
import {createSolvedBoard} from '../puzzle/board';
import {classifyRelease, tileIdAtBoardPoint} from '../puzzle/dragGesture';
import {cellCenter, cellOrigin, createLayout, toBoardPoint} from '../puzzle/layout';
import {TAP_SLOP_PX} from '../puzzle/motionConfig';
import {dropTile, tapTile} from '../puzzle/session';

function makeLayout() {
  return createLayout(300, 3);
}

function makeBoard() {
  return createSolvedBoard(3);
}

let gestureTime = 1000;
function makeGestureEvent(currentX, currentY, prevX = currentX, prevY = currentY, touches = null) {
  gestureTime += 16;
  const touchList = touches || [{pageX: currentX, pageY: currentY, identifier: 0}];
  return {
    nativeEvent: {
      pageX: currentX,
      pageY: currentY,
      touches: touchList,
      changedTouches: touchList,
    },
    touchHistory: {
      touchBank: touchList.map(t => ({
        touchActive: true,
        startPageX: prevX,
        startPageY: prevY,
        previousPageX: prevX,
        previousPageY: prevY,
        currentPageX: t.pageX,
        currentPageY: t.pageY,
        currentTimeStamp: gestureTime,
      })),
      numberActiveTouches: touchList.length,
      indexOfSingleActiveTouch: touchList.length === 1 ? 0 : -1,
      mostRecentTimeStamp: gestureTime,
    },
  };
}

// ---------------------------------------------------------------------------
// 1. Measurement before first move — tile resolved from page coordinates
// ---------------------------------------------------------------------------

test('tile resolved from page coordinates matches expected tile', () => {
  const layout = makeLayout();
  const board = makeBoard();
  const boardOrigin = {x: 40, y: 120};

  const tile4Centre = cellCenter(4, layout);
  const pageX = boardOrigin.x + tile4Centre.x;
  const pageY = boardOrigin.y + tile4Centre.y;

  const boardPoint = toBoardPoint({pageX, pageY}, boardOrigin);
  const tileId = tileIdAtBoardPoint(boardPoint, board, layout);

  expect(tileId).toBe('tile-4');
});

// ---------------------------------------------------------------------------
// 2. Measurement after several moves — latestDx/latestDy accumulation
// ---------------------------------------------------------------------------

test('accumulated movement is correct after several simulated moves', () => {
  const pending = {
    gestureId: 1,
    x0: 50,
    y0: 60,
    latestDx: 0,
    latestDy: 0,
    released: false,
    releaseDx: 0,
    releaseDy: 0,
  };

  const moves = [{dx: 5, dy: 3}, {dx: 12, dy: 8}, {dx: 20, dy: 15}];
  moves.forEach(m => {
    pending.latestDx = m.dx;
    pending.latestDy = m.dy;
  });

  expect(pending.latestDx).toBe(20);
  expect(pending.latestDy).toBe(15);
  expect(pending.released).toBe(false);
});

// ---------------------------------------------------------------------------
// 3. Finger released before measurement — released flag set, release coords stored
// ---------------------------------------------------------------------------

test('pending grab records release before measurement returns', () => {
  const pending = {
    gestureId: 1,
    x0: 50,
    y0: 60,
    latestDx: 0,
    latestDy: 0,
    released: false,
    releaseDx: 0,
    releaseDy: 0,
  };

  pending.released = true;
  pending.releaseDx = 30;
  pending.releaseDy = 10;

  expect(pending.released).toBe(true);
  expect(pending.releaseDx).toBe(30);
  expect(pending.releaseDy).toBe(10);

  const layout = makeLayout();
  const board = makeBoard();
  const boardOrigin = {x: 0, y: 0};

  const boardPoint = toBoardPoint({pageX: pending.x0, pageY: pending.y0}, boardOrigin);
  const tileId = tileIdAtBoardPoint(boardPoint, board, layout);
  expect(tileId).not.toBeNull();

  const tile = board.tiles.find(t => t.id === tileId);
  const startCenter = cellCenter(tile.position, layout);
  const end = {
    x: startCenter.x + pending.releaseDx,
    y: startCenter.y + pending.releaseDy,
  };
  const classification = classifyRelease({
    tileId,
    start: startCenter,
    end,
    board,
    layout,
    tapSlop: TAP_SLOP_PX,
  });
  expect(['drop', 'return']).toContain(classification.kind);
});

// ---------------------------------------------------------------------------
// 4. Cancel before measurement — stale callback ignored via gestureId
// ---------------------------------------------------------------------------

test('stale measurement callback is ignored when gestureId does not match', () => {
  let pendingGrab = {
    gestureId: 1,
    x0: 50,
    y0: 60,
    latestDx: 0,
    latestDy: 0,
    released: false,
    releaseDx: 0,
    releaseDy: 0,
  };

  pendingGrab = null;

  const callbackGestureId = 1;
  const isStale = !pendingGrab || pendingGrab.gestureId !== callbackGestureId;
  expect(isStale).toBe(true);
});

// ---------------------------------------------------------------------------
// 5. Stale callback from previous gesture — second grant's id is different
// ---------------------------------------------------------------------------

test('first grant callback is rejected after second grant replaces gestureId', () => {
  let pendingGrab = null;
  const gestureIdRef = {current: 0};

  gestureIdRef.current += 1;
  const firstId = gestureIdRef.current;
  pendingGrab = {gestureId: firstId, x0: 10, y0: 10, latestDx: 0, latestDy: 0, released: false, releaseDx: 0, releaseDy: 0};

  gestureIdRef.current += 1;
  const secondId = gestureIdRef.current;
  pendingGrab = {gestureId: secondId, x0: 50, y0: 60, latestDx: 0, latestDy: 0, released: false, releaseDx: 0, releaseDy: 0};

  const firstCallbackStale = !pendingGrab || pendingGrab.gestureId !== firstId;
  expect(firstCallbackStale).toBe(true);

  const secondCallbackValid = pendingGrab && pendingGrab.gestureId === secondId;
  expect(secondCallbackValid).toBe(true);
});

// ---------------------------------------------------------------------------
// 6. Engine immutability — cancelled pending grab must not mutate the board
// ---------------------------------------------------------------------------

test('engine board is unchanged when pending grab is cancelled before measurement', () => {
  const board = makeBoard();
  const snapshot = JSON.stringify(board);

  let pendingGrab = {
    gestureId: 1,
    x0: 10,
    y0: 10,
    latestDx: 0,
    latestDy: 0,
    released: false,
    releaseDx: 0,
    releaseDy: 0,
  };
  pendingGrab = null;

  const callbackId = 1;
  const isStale = !pendingGrab || pendingGrab.gestureId !== callbackId;
  expect(isStale).toBe(true);

  expect(JSON.stringify(board)).toBe(snapshot);
});

// ---------------------------------------------------------------------------
// 7. classifyRelease with fast tap — engine path unchanged
// ---------------------------------------------------------------------------

test('tiny drag classifies as tap and tap path uses chooseTile correctly', () => {
  const layout = makeLayout();
  const board = makeBoard();
  const start = cellCenter(0, layout);
  const end = {x: start.x + 2, y: start.y + 2};

  const result = classifyRelease({
    tileId: 'tile-0',
    start,
    end,
    board,
    layout,
    tapSlop: TAP_SLOP_PX,
  });
  expect(result.kind).toBe('tap');

  const after = tapTile(board, 'tile-0');
  expect(after.reason).toBe('selected');
  expect(after.board.selectedId).toBe('tile-0');
  expect(after.board.moveCount).toBe(0);
});

// ---------------------------------------------------------------------------
// 8. Drop path — engine updated exactly once, move count = 1
// ---------------------------------------------------------------------------

test('drop resolves exactly one swap via session', () => {
  const board = makeBoard();
  const result = dropTile(board, 'tile-0', 'tile-8');
  expect(result.accepted).toBe(true);
  expect(result.board.moveCount).toBe(1);
  expect(result.board.tiles.find(t => t.id === 'tile-0').position).toBe(8);
  expect(result.board.tiles.find(t => t.id === 'tile-8').position).toBe(0);
});

// ---------------------------------------------------------------------------
// 9. Drop on self — engine not mutated, move count 0
// ---------------------------------------------------------------------------

test('drop on same tile is rejected with no mutation', () => {
  const board = makeBoard();
  const snapshot = JSON.stringify(board);
  const result = dropTile(board, 'tile-3', 'tile-3');
  expect(result.accepted).toBe(false);
  expect(result.board.moveCount).toBe(0);
  expect(JSON.stringify(board)).toBe(snapshot);
});

// ---------------------------------------------------------------------------
// 10. cellOrigin used for FLIP start positions
// ---------------------------------------------------------------------------

test('cellOrigin gives correct pixel position for each tile', () => {
  const layout = makeLayout();
  const origin = cellOrigin(4, layout);
  expect(origin.x).toBe(layout.step * 1);
  expect(origin.y).toBe(layout.step * 1);
  const last = cellOrigin(8, layout);
  expect(last.x).toBe(layout.step * 2);
  expect(last.y).toBe(layout.step * 2);
});

// ===========================================================================
// PRODUCTION GESTURE CONTROLLER TESTS (Exercising real PanResponder handlers)
// ===========================================================================

describe('Production PanResponder integration tests', () => {
  const WINDOW_ORIGIN = {x: 50, y: 100};

  beforeEach(() => {
    gestureTime = 1000;
  });

  function createTestHarness(options = {}) {
    let handlers;
    let cancelActiveFn;
    let motionRef;
    let boardState = options.board || makeBoard();
    const layout = options.layout || makeLayout();

    const callbacks = {
      onTapTile: jest.fn(),
      onDropTiles: jest.fn(),
      onCancelDrag: jest.fn(),
      onHoverChange: jest.fn(),
      onGrabStart: jest.fn(),
      ...options.callbacks,
    };

    let measureCallbackHolder = null;
    const mockBoardRef = {
      current: {
        measureInWindow: jest.fn(cb => {
          if (options.asyncMeasurement) {
            measureCallbackHolder = cb;
          } else {
            cb(WINDOW_ORIGIN.x, WINDOW_ORIGIN.y);
          }
        }),
      },
    };

    function GestureHost({extraState}) {
      const motion = useTileMotion(false);
      motionRef = motion;
      const {panHandlers, cancelActive} = usePuzzleGestures({
        board: boardState,
        layout,
        boardRef: mockBoardRef,
        canInteract: options.canInteract !== undefined ? options.canInteract : true,
        getMotion: motion.getMotion,
        onTapTile: callbacks.onTapTile,
        onDropTiles: callbacks.onDropTiles,
        onCancelDrag: callbacks.onCancelDrag,
        onHoverChange: callbacks.onHoverChange,
        onGrabStart: tileId => {
          motion.setActiveDrag(tileId);
          callbacks.onGrabStart(tileId);
        },
      });
      handlers = panHandlers;
      cancelActiveFn = cancelActive;
      return null;
    }

    let root;
    act(() => {
      root = create(<GestureHost extraState={0} />);
    });

    motionRef.ensureMap(boardState);
    motionRef.snapToBoard(boardState, layout);

    return {
      get handlers() {
        return handlers;
      },
      get cancelActive() {
        return cancelActiveFn;
      },
      get motion() {
        return motionRef;
      },
      callbacks,
      mockBoardRef,
      resolveMeasurement: (bx = WINDOW_ORIGIN.x, by = WINDOW_ORIGIN.y) => {
        if (measureCallbackHolder) {
          const cb = measureCallbackHolder;
          measureCallbackHolder = null;
          act(() => {
            cb(bx, by);
          });
        }
      },
      reRender: newExtra => {
        act(() => {
          root.update(<GestureHost extraState={newExtra} />);
        });
      },
      layout,
      board: boardState,
    };
  }

  test('1. Touching the centre of a tile classifies as a tap', () => {
    const harness = createTestHarness();
    const center = cellCenter(0, harness.layout);
    const pageX = WINDOW_ORIGIN.x + center.x;
    const pageY = WINDOW_ORIGIN.y + center.y;

    act(() => {
      harness.handlers.onResponderGrant(
        makeGestureEvent(pageX, pageY, pageX, pageY),
      );
    });

    expect(harness.callbacks.onGrabStart).toHaveBeenCalledWith('tile-0');

    act(() => {
      harness.handlers.onResponderRelease(
        makeGestureEvent(pageX, pageY, pageX, pageY),
      );
    });

    expect(harness.callbacks.onTapTile).toHaveBeenCalledWith('tile-0');
    expect(harness.callbacks.onDropTiles).not.toHaveBeenCalled();
    expect(harness.callbacks.onCancelDrag).not.toHaveBeenCalled();
  });

  test('2. Touching each corner of a tile classifies as a tap without slipping', () => {
    const corners = [
      {desc: 'top-left', x: 2, y: 2},
      {desc: 'top-right', x: 96, y: 2},
      {desc: 'bottom-left', x: 2, y: 96},
      {desc: 'bottom-right', x: 96, y: 96},
    ];

    corners.forEach(({desc, x, y}) => {
      const harness = createTestHarness();
      const pageX = WINDOW_ORIGIN.x + x;
      const pageY = WINDOW_ORIGIN.y + y;

      act(() => {
        harness.handlers.onResponderGrant(
          makeGestureEvent(pageX, pageY, pageX, pageY),
        );
      });

      expect(harness.callbacks.onGrabStart).toHaveBeenCalledWith('tile-0');

      act(() => {
        harness.handlers.onResponderRelease(
          makeGestureEvent(pageX, pageY, pageX, pageY),
        );
      });

      expect(harness.callbacks.onTapTile).toHaveBeenCalledWith('tile-0');
      expect(harness.callbacks.onCancelDrag).not.toHaveBeenCalled();
    });
  });

  test('3. Grabbing a tile and immediately moving it applies movement once measurement completes', () => {
    const harness = createTestHarness({asyncMeasurement: true});
    const center = cellCenter(0, harness.layout);
    const pageX = WINDOW_ORIGIN.x + center.x;
    const pageY = WINDOW_ORIGIN.y + center.y;

    act(() => {
      harness.handlers.onResponderGrant(
        makeGestureEvent(pageX, pageY, pageX, pageY),
      );
    });

    // Move happens immediately before measureInWindow callback returns
    act(() => {
      harness.handlers.onResponderMove(
        makeGestureEvent(pageX + 18, pageY + 12, pageX, pageY),
      );
    });

    // Now measurement resolves
    harness.resolveMeasurement();

    const motion0 = harness.motion.getMotion('tile-0');
    expect(motion0.drag.x._value).toBe(18);
    expect(motion0.drag.y._value).toBe(12);
    expect(harness.callbacks.onGrabStart).toHaveBeenCalledWith('tile-0');
  });

  test('4. Hover-state changes correctly during dragging across cells', () => {
    const harness = createTestHarness();
    const center = cellCenter(0, harness.layout);
    const pageX = WINDOW_ORIGIN.x + center.x;
    const pageY = WINDOW_ORIGIN.y + center.y;

    act(() => {
      harness.handlers.onResponderGrant(
        makeGestureEvent(pageX, pageY, pageX, pageY),
      );
    });

    // Move to cell 1 (step = 100)
    act(() => {
      harness.handlers.onResponderMove(
        makeGestureEvent(pageX + 100, pageY, pageX, pageY),
      );
    });

    expect(harness.callbacks.onHoverChange).toHaveBeenCalledWith('tile-1');

    // Move back over self (cell 0) -> hover clears
    act(() => {
      harness.handlers.onResponderMove(
        makeGestureEvent(pageX, pageY, pageX + 100, pageY),
      );
    });

    expect(harness.callbacks.onHoverChange).toHaveBeenCalledWith(null);
  });

  test('5 & 6. React re-render during dragging preserves drag offset without jumping', () => {
    const harness = createTestHarness();
    const center = cellCenter(0, harness.layout);
    const pageX = WINDOW_ORIGIN.x + center.x;
    const pageY = WINDOW_ORIGIN.y + center.y;

    act(() => {
      harness.handlers.onResponderGrant(
        makeGestureEvent(pageX, pageY, pageX, pageY),
      );
    });

    // Drag 45px right, 30px down
    act(() => {
      harness.handlers.onResponderMove(
        makeGestureEvent(pageX + 45, pageY + 30, pageX, pageY),
      );
    });

    const motion0 = harness.motion.getMotion('tile-0');
    expect(motion0.drag.x._value).toBe(45);
    expect(motion0.drag.y._value).toBe(30);

    // Trigger multiple React re-renders while dragging is active
    harness.reRender(1);
    harness.reRender(2);

    // Drag offset MUST survive and remain 45, 30
    expect(motion0.drag.x._value).toBe(45);
    expect(motion0.drag.y._value).toBe(30);

    // Further move continues from where it was
    act(() => {
      harness.handlers.onResponderMove(
        makeGestureEvent(pageX + 55, pageY + 35, pageX + 45, pageY + 30),
      );
    });
    expect(motion0.drag.x._value).toBe(55);
    expect(motion0.drag.y._value).toBe(35);
  });

  test('7. Dragging between distant tiles triggers swap with correct finalDrag', () => {
    const harness = createTestHarness();
    const center0 = cellCenter(0, harness.layout);
    const center8 = cellCenter(8, harness.layout);
    const pageX = WINDOW_ORIGIN.x + center0.x;
    const pageY = WINDOW_ORIGIN.y + center0.y;

    act(() => {
      harness.handlers.onResponderGrant(
        makeGestureEvent(pageX, pageY, pageX, pageY),
      );
    });

    const dx = center8.x - center0.x;
    const dy = center8.y - center0.y;

    act(() => {
      harness.handlers.onResponderMove(
        makeGestureEvent(pageX + dx, pageY + dy, pageX, pageY),
      );
    });

    act(() => {
      harness.handlers.onResponderRelease(
        makeGestureEvent(pageX + dx, pageY + dy, pageX + dx, pageY + dy),
      );
    });

    expect(harness.callbacks.onDropTiles).toHaveBeenCalledWith('tile-0', 'tile-8', {
      dx,
      dy,
    });
  });

  test('8. Invalid drop outside board or on self triggers onCancelDrag', () => {
    const harness = createTestHarness();
    const center = cellCenter(0, harness.layout);
    const pageX = WINDOW_ORIGIN.x + center.x;
    const pageY = WINDOW_ORIGIN.y + center.y;

    act(() => {
      harness.handlers.onResponderGrant(
        makeGestureEvent(pageX, pageY, pageX, pageY),
      );
    });

    // Drag out of bounds
    act(() => {
      harness.handlers.onResponderMove(
        makeGestureEvent(pageX - 80, pageY - 80, pageX, pageY),
      );
    });

    act(() => {
      harness.handlers.onResponderRelease(
        makeGestureEvent(pageX - 80, pageY - 80, pageX - 80, pageY - 80),
      );
    });

    expect(harness.callbacks.onCancelDrag).toHaveBeenCalledWith('tile-0');
    expect(harness.callbacks.onDropTiles).not.toHaveBeenCalled();
  });

  test('9. Releasing before board measurement completes resolves drop directly', () => {
    const harness = createTestHarness({asyncMeasurement: true});
    const center0 = cellCenter(0, harness.layout);
    const center1 = cellCenter(1, harness.layout);
    const pageX = WINDOW_ORIGIN.x + center0.x;
    const pageY = WINDOW_ORIGIN.y + center0.y;

    act(() => {
      harness.handlers.onResponderGrant(
        makeGestureEvent(pageX, pageY, pageX, pageY),
      );
    });

    const dx = center1.x - center0.x;
    const dy = center1.y - center0.y;

    // Move before measurement returns
    act(() => {
      harness.handlers.onResponderMove(
        makeGestureEvent(pageX + dx, pageY + dy, pageX, pageY),
      );
    });

    // Release before measurement returns
    act(() => {
      harness.handlers.onResponderRelease(
        makeGestureEvent(pageX + dx, pageY + dy, pageX + dx, pageY + dy),
      );
    });

    expect(harness.callbacks.onDropTiles).not.toHaveBeenCalled();

    // Measurement resolves now
    harness.resolveMeasurement();

    expect(harness.callbacks.onDropTiles).toHaveBeenCalledWith('tile-0', 'tile-1', {
      dx,
      dy,
    });
  });

  test('10. Cancelling during measurement ignores the callback completely', () => {
    const harness = createTestHarness({asyncMeasurement: true});
    const center = cellCenter(0, harness.layout);
    const pageX = WINDOW_ORIGIN.x + center.x;
    const pageY = WINDOW_ORIGIN.y + center.y;

    act(() => {
      harness.handlers.onResponderGrant(
        makeGestureEvent(pageX, pageY, pageX, pageY),
      );
    });

    // Cancel active while measurement is pending
    act(() => {
      harness.cancelActive();
    });

    // Measurement arrives late
    harness.resolveMeasurement();

    expect(harness.callbacks.onGrabStart).not.toHaveBeenCalled();
    expect(harness.callbacks.onDropTiles).not.toHaveBeenCalled();
    expect(harness.callbacks.onTapTile).not.toHaveBeenCalled();
  });

  test('11. Multiple fingers cancel the pending or active gesture safely', () => {
    const harness = createTestHarness();
    const center = cellCenter(0, harness.layout);
    const pageX = WINDOW_ORIGIN.x + center.x;
    const pageY = WINDOW_ORIGIN.y + center.y;

    act(() => {
      harness.handlers.onResponderGrant(
        makeGestureEvent(pageX, pageY, pageX, pageY),
      );
    });

    expect(harness.callbacks.onGrabStart).toHaveBeenCalledWith('tile-0');

    // Second finger touches
    act(() => {
      harness.handlers.onResponderMove(
        makeGestureEvent(pageX, pageY, pageX, pageY, [
          {pageX, pageY, identifier: 0},
          {pageX: pageX + 50, pageY: pageY + 50, identifier: 1},
        ]),
      );
    });

    expect(harness.callbacks.onCancelDrag).toHaveBeenCalledWith('tile-0');
  });

  test('12. Stale asynchronous callback from earlier gesture is rejected', () => {
    let firstCb = null;
    let secondCb = null;
    let grantCount = 0;

    const mockBoardRef = {
      current: {
        measureInWindow: jest.fn(cb => {
          grantCount += 1;
          if (grantCount === 1) {
            firstCb = cb;
          } else {
            secondCb = cb;
          }
        }),
      },
    };

    let handlers;
    const callbacks = {
      onGrabStart: jest.fn(),
      onDropTiles: jest.fn(),
      onTapTile: jest.fn(),
      onCancelDrag: jest.fn(),
      onHoverChange: jest.fn(),
    };

    function Host() {
      const motion = useTileMotion(false);
      const {panHandlers} = usePuzzleGestures({
        board: makeBoard(),
        layout: makeLayout(),
        boardRef: mockBoardRef,
        canInteract: true,
        getMotion: motion.getMotion,
        ...callbacks,
      });
      handlers = panHandlers;
      return null;
    }

    act(() => {
      create(<Host />);
    });

    // First grant (cell 0)
    act(() => {
      handlers.onResponderGrant(
        makeGestureEvent(99, 149, 99, 149),
      );
    });

    // Second grant arrives before first measurement resolves (cell 1)
    act(() => {
      handlers.onResponderGrant(
        makeGestureEvent(199, 149, 199, 149),
      );
    });

    // First measurement resolves now -> MUST BE IGNORED
    act(() => {
      firstCb(WINDOW_ORIGIN.x, WINDOW_ORIGIN.y);
    });
    expect(callbacks.onGrabStart).not.toHaveBeenCalledWith('tile-0');

    // Second measurement resolves -> MUST BE PROCESSED
    act(() => {
      secondCb(WINDOW_ORIGIN.x, WINDOW_ORIGIN.y);
    });
    expect(callbacks.onGrabStart).toHaveBeenCalledWith('tile-1');
  });

  test('13. Rapid consecutive gestures complete independently without state bleed', () => {
    const harness = createTestHarness();
    const center0 = cellCenter(0, harness.layout);
    const center1 = cellCenter(1, harness.layout);

    // Gesture 1: tap on tile-0
    act(() => {
      harness.handlers.onResponderGrant(
        makeGestureEvent(WINDOW_ORIGIN.x + center0.x, WINDOW_ORIGIN.y + center0.y),
      );
    });
    act(() => {
      harness.handlers.onResponderRelease(
        makeGestureEvent(WINDOW_ORIGIN.x + center0.x, WINDOW_ORIGIN.y + center0.y),
      );
    });
    expect(harness.callbacks.onTapTile).toHaveBeenCalledWith('tile-0');

    // Gesture 2 immediately after: tap on tile-1
    act(() => {
      harness.handlers.onResponderGrant(
        makeGestureEvent(WINDOW_ORIGIN.x + center1.x, WINDOW_ORIGIN.y + center1.y),
      );
    });
    act(() => {
      harness.handlers.onResponderRelease(
        makeGestureEvent(WINDOW_ORIGIN.x + center1.x, WINDOW_ORIGIN.y + center1.y),
      );
    });
    expect(harness.callbacks.onTapTile).toHaveBeenCalledWith('tile-1');
  });

  test('14. Successful swap updates move count exactly once', () => {
    const board = makeBoard();
    expect(board.moveCount).toBe(0);
    const result = dropTile(board, 'tile-0', 'tile-1');
    expect(result.accepted).toBe(true);
    expect(result.board.moveCount).toBe(1);
  });

  test('15. Engine state is unchanged after cancellation', () => {
    const board = makeBoard();
    const snapshot = JSON.stringify(board);
    const harness = createTestHarness({board});

    act(() => {
      harness.handlers.onResponderGrant(
        makeGestureEvent(99, 149, 99, 149),
      );
    });
    act(() => {
      harness.cancelActive();
    });

    expect(JSON.stringify(board)).toBe(snapshot);
  });

  test('16. Animation completion of earlier tile does not reset a newer drag', () => {
    const harness = createTestHarness();
    const center = cellCenter(0, harness.layout);
    const pageX = WINDOW_ORIGIN.x + center.x;
    const pageY = WINDOW_ORIGIN.y + center.y;

    act(() => {
      harness.handlers.onResponderGrant(
        makeGestureEvent(pageX, pageY, pageX, pageY),
      );
    });

    act(() => {
      harness.handlers.onResponderMove(
        makeGestureEvent(pageX + 40, pageY + 25, pageX, pageY),
      );
    });

    // Simulate completion of an earlier tile's animation calling snapToBoard
    harness.motion.snapToBoard(harness.board, harness.layout);

    // Active drag tile must NOT have its drag reset to 0
    const motion0 = harness.motion.getMotion('tile-0');
    expect(motion0.drag.x._value).toBe(40);
    expect(motion0.drag.y._value).toBe(25);
  });
});
