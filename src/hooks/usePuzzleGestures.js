import {useCallback, useEffect, useMemo, useRef} from 'react';
import {AppState, PanResponder} from 'react-native';
import {classifyRelease, tileIdAtBoardPoint} from '../puzzle/dragGesture';
import {cellCenter, toBoardPoint} from '../puzzle/layout';
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

  // Refs for board and layout captured so callbacks inside panResponder
  // always see the latest values without recreating the responder.
  const boardSnapshotRef = useRef(board);
  boardSnapshotRef.current = board;
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const cancelActive = useCallback(() => {
    // Discard any in-flight measurement so its callback is ignored.
    pendingGrabRef.current = null;
    const active = activeRef.current;
    if (!active) {
      return;
    }
    activeRef.current = null;
    onHoverChange(null);
    getMotion(active.tileId).drag.setValue({x: 0, y: 0});
    onCancelDrag(active.tileId);
  }, [getMotion, onCancelDrag, onHoverChange]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (appStateRef.current.match(/active/) && next.match(/inactive|background/)) {
        cancelActive();
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [cancelActive]);

  // Called from inside measureInWindow callback to finish resolving the grab.
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
        console.warn('Gesture: touch did not land on a tile.', boardPoint);
        pendingGrabRef.current = null;
        return;
      }

      const tile = currentBoard.tiles.find(t => t.id === tileId);
      if (!tile) {
        pendingGrabRef.current = null;
        return;
      }

      const startCenter = cellCenter(tile.position, currentLayout);

      // Apply all movement that accumulated while measurement was in flight.
      const motion = getMotion(tileId);
      motion.drag.setValue({x: pending.latestDx, y: pending.latestDy});

      activeRef.current = {
        tileId,
        start: boardPoint,
        startCenter,
      };

      if (!pending.released) {
        // Normal case: finger still down — announce the grab.
        onGrabStart(tileId);
        pendingGrabRef.current = null;
        return;
      }

      // Finger already lifted — skip grab animation, go straight to release.
      const end = {
        x: startCenter.x + pending.releaseDx,
        y: startCenter.y + pending.releaseDy,
      };
      const classification = classifyRelease({
        tileId,
        start: boardPoint,
        end,
        board: currentBoard,
        layout: currentLayout,
        tapSlop: TAP_SLOP_PX,
      });

      activeRef.current = null;
      onHoverChange(null);
      motion.drag.setValue({x: 0, y: 0});
      pendingGrabRef.current = null;

      if (classification.kind === 'tap') {
        onTapTile(tileId);
      } else if (classification.kind === 'drop' && classification.targetTileId) {
        onDropTiles(tileId, classification.targetTileId);
      } else {
        onCancelDrag(tileId);
      }
    },
    [getMotion, onCancelDrag, onDropTiles, onGrabStart, onHoverChange, onTapTile],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => canInteract,
        onMoveShouldSetPanResponder: () => Boolean(activeRef.current) || Boolean(pendingGrabRef.current),
        onPanResponderTerminationRequest: () => activeRef.current === null && pendingGrabRef.current === null,
        onShouldBlockNativeResponder: () => true,

        onPanResponderGrant: (event, gestureState) => {
          if (!canInteract) {
            return;
          }
          if (!boardRef.current) {
            console.warn('Gesture: board ref not available at touch start.');
            return;
          }

          // Stamp this gesture so stale callbacks can be ignored.
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

          boardRef.current.measureInWindow((bx, by) => {
            const pending = pendingGrabRef.current;
            // Reject stale or cancelled callbacks.
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
          // While measurement is in flight, accumulate movement but don't set drag.
          if (pendingGrabRef.current) {
            pendingGrabRef.current.latestDx = gestureState.dx;
            pendingGrabRef.current.latestDy = gestureState.dy;
            return;
          }

          const active = activeRef.current;
          if (!active) {
            return;
          }
          if (event.nativeEvent.touches && event.nativeEvent.touches.length > 1) {
            cancelActive();
            return;
          }

          const currentBoard = boardSnapshotRef.current;
          const currentLayout = layoutRef.current;

          getMotion(active.tileId).drag.setValue({
            x: gestureState.dx,
            y: gestureState.dy,
          });

          const end = {
            x: active.startCenter.x + gestureState.dx,
            y: active.startCenter.y + gestureState.dy,
          };
          const classification = classifyRelease({
            tileId: active.tileId,
            start: active.start,
            end,
            board: currentBoard,
            layout: currentLayout,
            tapSlop: TAP_SLOP_PX,
          });
          if (classification.kind === 'drop' && classification.targetTileId) {
            onHoverChange(classification.targetTileId);
          } else {
            onHoverChange(null);
          }
        },

        onPanResponderRelease: (event, gestureState) => {
          // If measurement is still in flight, record the release; callback handles it.
          if (pendingGrabRef.current) {
            pendingGrabRef.current.released = true;
            pendingGrabRef.current.releaseDx = gestureState.dx;
            pendingGrabRef.current.releaseDy = gestureState.dy;
            return;
          }

          const active = activeRef.current;
          activeRef.current = null;
          onHoverChange(null);
          if (!active) {
            return;
          }

          const currentBoard = boardSnapshotRef.current;
          const currentLayout = layoutRef.current;

          getMotion(active.tileId).drag.setValue({
            x: gestureState.dx,
            y: gestureState.dy,
          });

          const end = {
            x: active.startCenter.x + gestureState.dx,
            y: active.startCenter.y + gestureState.dy,
          };
          const classification = classifyRelease({
            tileId: active.tileId,
            start: active.start,
            end,
            board: currentBoard,
            layout: currentLayout,
            tapSlop: TAP_SLOP_PX,
          });

          if (classification.kind === 'tap') {
            getMotion(active.tileId).drag.setValue({x: 0, y: 0});
            onTapTile(active.tileId);
            return;
          }
          if (classification.kind === 'drop' && classification.targetTileId) {
            onDropTiles(active.tileId, classification.targetTileId, active);
            return;
          }
          onCancelDrag(active.tileId);
        },

        onPanResponderTerminate: () => {
          cancelActive();
        },
      }),
    // The panResponder is created once. Board and layout are accessed via refs
    // so changes don't require recreation mid-gesture.
    // canInteract and callbacks are in the dependency array because they control
    // whether the responder claims new touches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canInteract, onCancelDrag, onDropTiles, onHoverChange, onGrabStart, onTapTile],
  );

  return {
    panHandlers: panResponder.panHandlers,
    cancelActive,
  };
}
