import {useCallback, useEffect, useMemo, useRef} from 'react';
import {AppState, PanResponder} from 'react-native';
import {classifyRelease, tileIdAtBoardPoint} from '../puzzle/dragGesture';
import {cellCenter, cellOrigin, toBoardPoint} from '../puzzle/layout';
import {TAP_SLOP_PX} from '../puzzle/motionConfig';

/**
 * pendingGrabRef shape while measureInWindow is in flight:
 * {
 *   gestureId: number,   // stamp to reject stale callbacks
 *   x0: number,          // pageX of initial touch
 *   y0: number,          // pageY of initial touch
 *   latestDx: number,    // accumulated dx from move events before tile resolved
 *   latestDy: number,
 *   released: boolean,   // finger lifted before measurement returned
 *   releaseDx: number,   // final dx at release
 *   releaseDy: number,
 * }
 */

export function usePuzzleGestures({
  board,
  layout,
  boardRef,
  canInteract,
  getMotion,
  onTapTile,
  onDropTiles,
  onCancelDrag,
  onHoverChange,
  onGrabStart,
}) {
  const activeRef = useRef(null);
  const pendingGrabRef = useRef(null);
  const gestureIdRef = useRef(0);
  const appStateRef = useRef(AppState.currentState);

  // Capture mutable props and callbacks in refs so the PanResponder
  // instance remains completely stable across renders and gestures.
  const boardSnapshotRef = useRef(board);
  boardSnapshotRef.current = board;

  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const canInteractRef = useRef(canInteract);
  canInteractRef.current = canInteract;

  const getMotionRef = useRef(getMotion);
  getMotionRef.current = getMotion;

  const boardRefRef = useRef(boardRef);
  boardRefRef.current = boardRef;

  const callbacksRef = useRef({
    onTapTile,
    onDropTiles,
    onCancelDrag,
    onHoverChange,
    onGrabStart,
  });
  callbacksRef.current = {
    onTapTile,
    onDropTiles,
    onCancelDrag,
    onHoverChange,
    onGrabStart,
  };

  const cancelActive = useCallback(() => {
    pendingGrabRef.current = null;
    const active = activeRef.current;
    if (!active) {
      return;
    }
    activeRef.current = null;
    callbacksRef.current.onHoverChange(null);
    callbacksRef.current.onCancelDrag(active.tileId);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (appStateRef.current.match(/active/) && next.match(/inactive|background/)) {
        cancelActive();
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [cancelActive]);

  const resolvePendingGrab = useCallback(
    (bx, by, pending) => {
      const currentBoard = boardSnapshotRef.current;
      const currentLayout = layoutRef.current;
      let boardPoint;
      try {
        boardPoint = toBoardPoint({pageX: pending.x0, pageY: pending.y0}, {x: bx, y: by});
      } catch (conversionError) {
        console.warn(
          'Gesture: could not convert touch to board coordinates.',
          conversionError instanceof Error ? conversionError.message : conversionError,
        );
        pendingGrabRef.current = null;
        return;
      }

      const tileId = tileIdAtBoardPoint(boardPoint, currentBoard, currentLayout);
      if (!tileId) {
        pendingGrabRef.current = null;
        return;
      }

      const tile = currentBoard.tiles.find(t => t.id === tileId);
      if (!tile) {
        pendingGrabRef.current = null;
        return;
      }

      const startCenter = cellCenter(tile.position, currentLayout);
      const origin = cellOrigin(tile.position, currentLayout);
      const touchOffset = {
        x: boardPoint.x - origin.x,
        y: boardPoint.y - origin.y,
      };

      const motion = getMotionRef.current(tileId);
      motion.drag.setValue({x: pending.latestDx, y: pending.latestDy});

      activeRef.current = {
        tileId,
        startCenter,
        touchOffset,
      };

      if (!pending.released) {
        callbacksRef.current.onGrabStart(tileId);
        pendingGrabRef.current = null;
        return;
      }

      // Finger was released while measurement was in flight.
      const end = {
        x: startCenter.x + pending.releaseDx,
        y: startCenter.y + pending.releaseDy,
      };
      const classification = classifyRelease({
        tileId,
        start: startCenter,
        end,
        board: currentBoard,
        layout: currentLayout,
        tapSlop: TAP_SLOP_PX,
      });

      activeRef.current = null;
      callbacksRef.current.onHoverChange(null);
      pendingGrabRef.current = null;

      if (classification.kind === 'tap') {
        motion.drag.setValue({x: 0, y: 0});
        callbacksRef.current.onTapTile(tileId);
      } else if (classification.kind === 'drop' && classification.targetTileId) {
        callbacksRef.current.onDropTiles(tileId, classification.targetTileId, {
          dx: pending.releaseDx,
          dy: pending.releaseDy,
        });
      } else {
        callbacksRef.current.onCancelDrag(tileId);
      }
    },
    [],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => canInteractRef.current,
        onMoveShouldSetPanResponder: () =>
          Boolean(activeRef.current) || Boolean(pendingGrabRef.current),
        onPanResponderTerminationRequest: () =>
          activeRef.current === null && pendingGrabRef.current === null,
        onShouldBlockNativeResponder: () => true,

        onPanResponderGrant: (event, gestureState) => {
          if (!canInteractRef.current) {
            return;
          }
          if (event.nativeEvent?.touches && event.nativeEvent.touches.length > 1) {
            cancelActive();
            return;
          }
          const currentBoardRef = boardRefRef.current;
          if (!currentBoardRef || !currentBoardRef.current) {
            console.warn('Gesture: board ref not available at touch start.');
            return;
          }

          gestureIdRef.current += 1;
          const myId = gestureIdRef.current;

          pendingGrabRef.current = {
            gestureId: myId,
            x0: gestureState.x0,
            y0: gestureState.y0,
            latestDx: 0,
            latestDy: 0,
            released: false,
            releaseDx: 0,
            releaseDy: 0,
          };

          currentBoardRef.current.measureInWindow((bx, by) => {
            const pending = pendingGrabRef.current;
            if (!pending || pending.gestureId !== myId) {
              return;
            }
            if (!Number.isFinite(bx) || !Number.isFinite(by)) {
              console.warn('Gesture: measureInWindow returned non-finite values.', bx, by);
              pendingGrabRef.current = null;
              return;
            }
            resolvePendingGrab(bx, by, pending);
          });
        },

        onPanResponderMove: (event, gestureState) => {
          if (event.nativeEvent?.touches && event.nativeEvent.touches.length > 1) {
            cancelActive();
            return;
          }

          if (pendingGrabRef.current) {
            pendingGrabRef.current.latestDx = gestureState.dx;
            pendingGrabRef.current.latestDy = gestureState.dy;
            return;
          }

          const active = activeRef.current;
          if (!active) {
            return;
          }

          const currentBoard = boardSnapshotRef.current;
          const currentLayout = layoutRef.current;

          getMotionRef.current(active.tileId).drag.setValue({
            x: gestureState.dx,
            y: gestureState.dy,
          });

          const end = {
            x: active.startCenter.x + gestureState.dx,
            y: active.startCenter.y + gestureState.dy,
          };
          const classification = classifyRelease({
            tileId: active.tileId,
            start: active.startCenter,
            end,
            board: currentBoard,
            layout: currentLayout,
            tapSlop: TAP_SLOP_PX,
          });
          if (classification.kind === 'drop' && classification.targetTileId) {
            callbacksRef.current.onHoverChange(classification.targetTileId);
          } else {
            callbacksRef.current.onHoverChange(null);
          }
        },

        onPanResponderRelease: (event, gestureState) => {
          if (pendingGrabRef.current) {
            pendingGrabRef.current.released = true;
            pendingGrabRef.current.releaseDx = gestureState.dx;
            pendingGrabRef.current.releaseDy = gestureState.dy;
            return;
          }

          const active = activeRef.current;
          activeRef.current = null;
          callbacksRef.current.onHoverChange(null);
          if (!active) {
            return;
          }

          const currentBoard = boardSnapshotRef.current;
          const currentLayout = layoutRef.current;

          getMotionRef.current(active.tileId).drag.setValue({
            x: gestureState.dx,
            y: gestureState.dy,
          });

          const end = {
            x: active.startCenter.x + gestureState.dx,
            y: active.startCenter.y + gestureState.dy,
          };
          const classification = classifyRelease({
            tileId: active.tileId,
            start: active.startCenter,
            end,
            board: currentBoard,
            layout: currentLayout,
            tapSlop: TAP_SLOP_PX,
          });

          if (classification.kind === 'tap') {
            getMotionRef.current(active.tileId).drag.setValue({x: 0, y: 0});
            callbacksRef.current.onTapTile(active.tileId);
            return;
          }
          if (classification.kind === 'drop' && classification.targetTileId) {
            callbacksRef.current.onDropTiles(active.tileId, classification.targetTileId, {
              dx: gestureState.dx,
              dy: gestureState.dy,
            });
            return;
          }
          callbacksRef.current.onCancelDrag(active.tileId);
        },

        onPanResponderTerminate: () => {
          cancelActive();
        },
      }),
    [cancelActive, resolvePendingGrab],
  );

  return {
    panHandlers: panResponder.panHandlers,
    cancelActive,
  };
}
