import {useCallback, useEffect, useMemo, useRef} from 'react';
import {AppState, PanResponder} from 'react-native';
import {classifyRelease, tileIdAtBoardPoint} from '../puzzle/dragGesture';
import {cellCenter, toBoardPoint} from '../puzzle/layout';
import {TAP_SLOP_PX} from '../puzzle/motionConfig';

export function usePuzzleGestures({
  board,
  layout,
  boardRef,
  boardWindowOriginRef,
  measureBoard,
  canInteract,
  getMotion,
  onTapTile,
  onDropTiles,
  onCancelDrag,
  onHoverChange,
  onGrabStart,
}) {
  const activeRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  const cancelActive = useCallback(() => {
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

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => canInteract,
        onMoveShouldSetPanResponder: () => Boolean(activeRef.current),
        onPanResponderTerminationRequest: () => activeRef.current === null,
        onPanResponderGrant: (event, gestureState) => {
          if (!canInteract) {
            return;
          }
          measureBoard();
          let boardPoint;
          try {
            boardPoint = toBoardPoint(
              {pageX: gestureState.x0, pageY: gestureState.y0},
              boardWindowOriginRef.current,
            );
          } catch (originError) {
            console.warn(originError.message || 'Could not convert touch to board coordinates.');
            return;
          }
          const tileId = tileIdAtBoardPoint(boardPoint, board, layout);
          if (!tileId) {
            return;
          }
          const tile = board.tiles.find(item => item.id === tileId);
          if (!tile) {
            return;
          }
          const startCenter = cellCenter(tile.position, layout);
          activeRef.current = {
            tileId,
            start: boardPoint,
            startCenter,
          };
          getMotion(tileId).drag.setValue({x: 0, y: 0});
          onHoverChange(null);
          onGrabStart(tileId);
        },
        onPanResponderMove: (event, gestureState) => {
          const active = activeRef.current;
          if (!active) {
            return;
          }
          if (event.nativeEvent.touches && event.nativeEvent.touches.length > 1) {
            cancelActive();
            return;
          }
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
            board,
            layout,
            tapSlop: TAP_SLOP_PX,
          });
          if (classification.kind === 'drop' && classification.targetTileId) {
            onHoverChange(classification.targetTileId);
          } else {
            onHoverChange(null);
          }
        },
        onPanResponderRelease: (event, gestureState) => {
          const active = activeRef.current;
          activeRef.current = null;
          onHoverChange(null);
          if (!active) {
            return;
          }
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
            board,
            layout,
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
    [
      board,
      boardWindowOriginRef,
      cancelActive,
      canInteract,
      getMotion,
      layout,
      measureBoard,
      onCancelDrag,
      onDropTiles,
      onHoverChange,
      onGrabStart,
      onTapTile,
    ],
  );

  return {
    panHandlers: panResponder.panHandlers,
    cancelActive,
  };
}
