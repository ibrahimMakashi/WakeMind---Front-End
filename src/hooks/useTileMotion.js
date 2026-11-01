import {useCallback, useEffect, useMemo, useRef} from 'react';
import {Animated, Easing} from 'react-native';
import {cellOrigin} from '../puzzle/layout';
import {
  GRAB_DURATION_MS,
  GRAB_SCALE,
  RETURN_DURATION_MS,
  SHUFFLE_STAGGER_MS,
  SHUFFLE_TOTAL_MS,
  SWAP_DURATION_MS,
} from '../puzzle/motionConfig';
import {motionDuration} from '../theme/motion';

const MOTION_EASING = Easing.out(Easing.cubic);
const SHUFFLE_EASING = Easing.out(Easing.cubic);

function runTiming(value, config) {
  return new Promise(resolve => {
    Animated.timing(value, config).start(({finished}) => resolve(Boolean(finished)));
  });
}

function createTileMotion() {
  return {
    position: new Animated.ValueXY({x: 0, y: 0}),
    drag: new Animated.ValueXY({x: 0, y: 0}),
    scale: new Animated.Value(1),
    overlay: new Animated.Value(0),
  };
}

export function useTileMotion(reducedMotion) {
  const mapRef = useRef({});
  const activeAnimationTilesRef = useRef(new Set());
  const activeDragTileRef = useRef(null);
  const shuffleTimersRef = useRef([]);

  useEffect(() => {
    return () => {
      shuffleTimersRef.current.forEach(clearTimeout);
      shuffleTimersRef.current = [];
    };
  }, []);

  const ensureMap = useCallback(board => {
    board.tiles.forEach(tile => {
      if (!mapRef.current[tile.id]) {
        mapRef.current[tile.id] = createTileMotion();
      }
    });
    const ids = new Set(board.tiles.map(t => t.id));
    Object.keys(mapRef.current).forEach(id => {
      if (!ids.has(id)) {
        delete mapRef.current[id];
      }
    });
  }, []);

  const getMotion = useCallback(tileId => {
    if (!mapRef.current[tileId]) {
      mapRef.current[tileId] = createTileMotion();
    }
    return mapRef.current[tileId];
  }, []);

  const setActiveDrag = useCallback(tileId => {
    activeDragTileRef.current = tileId;
  }, []);

  const snapToBoard = useCallback(
    (board, layout, options = {}) => {
      ensureMap(board);
      const ignoreSet = new Set(
        Array.isArray(options.ignoreIds) ? options.ignoreIds : [],
      );
      if (options.excludeTileId) {
        ignoreSet.add(options.excludeTileId);
      }
      if (!options.force && activeDragTileRef.current) {
        ignoreSet.add(activeDragTileRef.current);
      }
      board.tiles.forEach(tile => {
        if (ignoreSet.has(tile.id)) {
          return;
        }
        if (!options.force && activeAnimationTilesRef.current.has(tile.id)) {
          return;
        }
        const origin = cellOrigin(tile.position, layout);
        const motion = getMotion(tile.id);
        motion.position.setValue({x: origin.x, y: origin.y});
        motion.drag.setValue({x: 0, y: 0});
        motion.scale.setValue(1);
        motion.overlay.setValue(0);
      });
    },
    [ensureMap, getMotion],
  );

  const animateGrab = useCallback(
    tileId => {
      const motion = getMotion(tileId);
      activeAnimationTilesRef.current.add(tileId);
      const duration = motionDuration(reducedMotion, GRAB_DURATION_MS);
      const scaleTo = reducedMotion ? 1 : GRAB_SCALE;
      return Promise.all([
        runTiming(motion.overlay, {
          toValue: 1,
          duration,
          easing: MOTION_EASING,
          useNativeDriver: true,
        }),
        runTiming(motion.scale, {
          toValue: scaleTo,
          duration,
          easing: MOTION_EASING,
          useNativeDriver: true,
        }),
      ]).finally(() => {
        activeAnimationTilesRef.current.delete(tileId);
      });
    },
    [getMotion, reducedMotion],
  );

  const animateReleaseGrab = useCallback(
    tileId => {
      const motion = getMotion(tileId);
      const duration = motionDuration(reducedMotion, GRAB_DURATION_MS);
      return Promise.all([
        runTiming(motion.overlay, {
          toValue: 0,
          duration,
          easing: MOTION_EASING,
          useNativeDriver: true,
        }),
        runTiming(motion.scale, {
          toValue: 1,
          duration,
          easing: MOTION_EASING,
          useNativeDriver: true,
        }),
      ]);
    },
    [getMotion, reducedMotion],
  );

  const animateReturn = useCallback(
    (board, layout, tileId) => {
      const motion = getMotion(tileId);
      const tile = board.tiles.find(t => t.id === tileId);
      if (!tile) {
        return Promise.resolve(true);
      }
      activeAnimationTilesRef.current.add(tileId);
      const target = cellOrigin(tile.position, layout);
      const duration = motionDuration(reducedMotion, RETURN_DURATION_MS);
      if (duration === 0) {
        motion.position.setValue(target);
        motion.drag.setValue({x: 0, y: 0});
        motion.scale.setValue(1);
        motion.overlay.setValue(0);
        activeAnimationTilesRef.current.delete(tileId);
        return Promise.resolve(true);
      }
      return Promise.all([
        runTiming(motion.drag, {
          toValue: {x: 0, y: 0},
          duration,
          easing: MOTION_EASING,
          useNativeDriver: true,
        }),
        runTiming(motion.scale, {
          toValue: 1,
          duration,
          easing: MOTION_EASING,
          useNativeDriver: true,
        }),
        runTiming(motion.overlay, {
          toValue: 0,
          duration,
          easing: MOTION_EASING,
          useNativeDriver: true,
        }),
      ])
        .then(() => {
          motion.position.setValue(target);
          motion.drag.setValue({x: 0, y: 0});
          motion.scale.setValue(1);
          motion.overlay.setValue(0);
        })
        .finally(() => {
          activeAnimationTilesRef.current.delete(tileId);
        });
    },
    [getMotion, reducedMotion],
  );

  const animateSwap = useCallback(
    (board, layout, tileIdA, tileIdB, fromPosA, fromPosB, finalDragA = null) => {
      const motionA = getMotion(tileIdA);
      const motionB = getMotion(tileIdB);
      const tileA = board.tiles.find(t => t.id === tileIdA);
      const tileB = board.tiles.find(t => t.id === tileIdB);
      if (!tileA || !tileB) {
        return Promise.resolve(true);
      }
      activeAnimationTilesRef.current.add(tileIdA);
      activeAnimationTilesRef.current.add(tileIdB);

      const toA = cellOrigin(tileA.position, layout);
      const toB = cellOrigin(tileB.position, layout);

      const duration = motionDuration(reducedMotion, SWAP_DURATION_MS);
      if (duration === 0) {
        motionA.position.setValue(toA);
        motionB.position.setValue(toB);
        motionA.drag.setValue({x: 0, y: 0});
        motionB.drag.setValue({x: 0, y: 0});
        motionA.scale.setValue(1);
        motionA.overlay.setValue(0);
        motionB.scale.setValue(1);
        motionB.overlay.setValue(0);
        activeAnimationTilesRef.current.delete(tileIdA);
        activeAnimationTilesRef.current.delete(tileIdB);
        return Promise.resolve(true);
      }

      // Parallel coordinated settling:
      // Tile A animates from drag offset to destination cell slot,
      // simultaneously scaling back to 1 and fading overlay to 0.
      // Tile B animates to its destination cell slot simultaneously.
      const anims = [];

      if (
        finalDragA &&
        Number.isFinite(finalDragA.dx) &&
        Number.isFinite(finalDragA.dy)
      ) {
        motionA.position.setValue(fromPosA);
        motionA.drag.setValue({x: finalDragA.dx, y: finalDragA.dy});
        anims.push(
          runTiming(motionA.drag, {
            toValue: {x: toA.x - fromPosA.x, y: toA.y - fromPosA.y},
            duration,
            easing: MOTION_EASING,
            useNativeDriver: true,
          }),
        );
      } else {
        motionA.position.setValue(fromPosA);
        motionA.drag.setValue({x: 0, y: 0});
        anims.push(
          runTiming(motionA.position, {
            toValue: toA,
            duration,
            easing: MOTION_EASING,
            useNativeDriver: true,
          }),
        );
      }

      anims.push(
        runTiming(motionA.scale, {
          toValue: 1,
          duration,
          easing: MOTION_EASING,
          useNativeDriver: true,
        }),
      );
      anims.push(
        runTiming(motionA.overlay, {
          toValue: 0,
          duration,
          easing: MOTION_EASING,
          useNativeDriver: true,
        }),
      );

      motionB.position.setValue(fromPosB);
      motionB.drag.setValue({x: 0, y: 0});
      anims.push(
        runTiming(motionB.position, {
          toValue: toB,
          duration,
          easing: MOTION_EASING,
          useNativeDriver: true,
        }),
      );
      anims.push(
        runTiming(motionB.scale, {
          toValue: 1,
          duration,
          easing: MOTION_EASING,
          useNativeDriver: true,
        }),
      );
      anims.push(
        runTiming(motionB.overlay, {
          toValue: 0,
          duration,
          easing: MOTION_EASING,
          useNativeDriver: true,
        }),
      );

      return Promise.all(anims)
        .then(() => {
          motionA.position.setValue(toA);
          motionA.drag.setValue({x: 0, y: 0});
          motionA.scale.setValue(1);
          motionA.overlay.setValue(0);
          motionB.position.setValue(toB);
          motionB.drag.setValue({x: 0, y: 0});
          motionB.scale.setValue(1);
          motionB.overlay.setValue(0);
        })
        .finally(() => {
          activeAnimationTilesRef.current.delete(tileIdA);
          activeAnimationTilesRef.current.delete(tileIdB);
        });
    },
    [getMotion, reducedMotion],
  );

  const animateShuffle = useCallback(
    (previousBoard, nextBoard, layout) => {
      ensureMap(nextBoard);
      nextBoard.tiles.forEach(t => activeAnimationTilesRef.current.add(t.id));
      const duration = motionDuration(reducedMotion, SHUFFLE_TOTAL_MS);
      const tasks = nextBoard.tiles.map((tile, index) => {
        const motion = getMotion(tile.id);
        const prev = previousBoard.tiles.find(t => t.id === tile.id);
        const from = cellOrigin(prev ? prev.position : tile.position, layout);
        const to = cellOrigin(tile.position, layout);
        motion.position.setValue(from);
        if (duration === 0) {
          motion.position.setValue(to);
          return Promise.resolve(true);
        }
        const delay = index * SHUFFLE_STAGGER_MS;
        return new Promise(resolve => {
          const timerId = setTimeout(() => {
            runTiming(motion.position, {
              toValue: to,
              duration: Math.max(80, duration - delay),
              easing: SHUFFLE_EASING,
              useNativeDriver: true,
            }).then(resolve);
          }, delay);
          shuffleTimersRef.current.push(timerId);
        });
      });
      return Promise.all(tasks).finally(() => {
        nextBoard.tiles.forEach(t => activeAnimationTilesRef.current.delete(t.id));
      });
    },
    [ensureMap, getMotion, reducedMotion],
  );

  const stopAll = useCallback(() => {
    shuffleTimersRef.current.forEach(clearTimeout);
    shuffleTimersRef.current = [];
    activeAnimationTilesRef.current.clear();
    activeDragTileRef.current = null;
    Object.values(mapRef.current).forEach(motion => {
      motion.position.stopAnimation();
      motion.drag.stopAnimation();
      motion.scale.stopAnimation();
      motion.overlay.stopAnimation();
    });
  }, []);

  return useMemo(
    () => ({
      getMotion,
      snapToBoard,
      animateGrab,
      animateReleaseGrab,
      animateReturn,
      animateSwap,
      animateShuffle,
      stopAll,
      ensureMap,
      setActiveDrag,
    }),
    [
      getMotion,
      snapToBoard,
      animateGrab,
      animateReleaseGrab,
      animateReturn,
      animateSwap,
      animateShuffle,
      stopAll,
      ensureMap,
      setActiveDrag,
    ],
  );
}
