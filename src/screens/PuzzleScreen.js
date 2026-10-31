import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
  useWindowDimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {PuzzleBoard} from '../components/puzzle/PuzzleBoard';
import {PuzzleCompletion} from '../components/puzzle/PuzzleCompletion';
import {PuzzleHud} from '../components/puzzle/PuzzleHud';
import {spacing} from '../constants/theme';
import {usePuzzleGame} from '../hooks/usePuzzleGame';
import {usePuzzleGestures} from '../hooks/usePuzzleGestures';
import {useTileMotion} from '../hooks/useTileMotion';
import {cellOrigin, createLayout} from '../puzzle/layout';
import {COMPLETION_GLOW_MS, COMPLETION_HAPTIC_MS} from '../puzzle/motionConfig';
import {motionDuration} from '../theme/motion';
import {useTheme} from '../theme/ThemeProvider';
import {usePrefersReducedMotion} from '../theme/usePrefersReducedMotion';

function cloneBoardSnapshot(board) {
  return {
    ...board,
    tiles: board.tiles.map(tile => ({...tile})),
  };
}

export function PuzzleScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {colors, typography} = useTheme();
  const reducedMotion = usePrefersReducedMotion();
  const {width} = useWindowDimensions();
  const boardWidth = width - spacing.md * 2;

  const {
    board,
    boardRef: gameStateRef,
    difficulty,
    phase,
    canInteract,
    applyTap,
    applyDrop,
    applyShuffle,
    startNewDifficulty,
    checkSolved,
    markSolved,
    unlockAfterComplete,
    setPhaseSafe,
  } = usePuzzleGame('easy');

  const {
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
  } = useTileMotion(reducedMotion);

  const layout = useMemo(
    () => createLayout(boardWidth, board.size),
    [boardWidth, board.size],
  );

  const boardViewRef = useRef(null);
  const [hoverId, setHoverId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const completionGlow = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const mountedScrambleRef = useRef(false);
  const initialSetupDoneRef = useRef(false);
  const prevLayoutRef = useRef({boardPx: layout.boardPx, size: layout.size});

  const runScramble = useCallback(
    async random => {
      setPhaseSafe('animating');
      const previous = cloneBoardSnapshot(gameStateRef.current);
      const next = applyShuffle(random);
      await animateShuffle(previous, next, layout);
      snapToBoard(next, layout);
      setPhaseSafe('idle');
    },
    [animateShuffle, applyShuffle, gameStateRef, layout, setPhaseSafe, snapToBoard],
  );

  // Initial board setup once on mount
  useEffect(() => {
    if (!initialSetupDoneRef.current) {
      initialSetupDoneRef.current = true;
      ensureMap(gameStateRef.current);
      snapToBoard(gameStateRef.current, layout);
    }
  }, [ensureMap, gameStateRef, layout, snapToBoard]);

  // Initial scramble only on first mount
  useEffect(() => {
    if (mountedScrambleRef.current) {
      return;
    }
    mountedScrambleRef.current = true;
    runScramble(Math.random).catch(scrambleError => {
      console.warn(
        'Initial puzzle scramble failed.',
        scrambleError instanceof Error ? scrambleError.message : scrambleError,
      );
      setPhaseSafe('idle');
    });
  }, [runScramble, setPhaseSafe]);

  const finishSwapAnimation = useCallback(async () => {
    snapToBoard(gameStateRef.current, layout);
    if (checkSolved()) {
      markSolved();
      try {
        Vibration.vibrate(COMPLETION_HAPTIC_MS);
      } catch (hapticError) {
        console.warn(
          'Completion haptic failed.',
          hapticError instanceof Error ? hapticError.message : hapticError,
        );
      }
      AccessibilityInfo.announceForAccessibility('Puzzle complete');
      const glowMs = motionDuration(reducedMotion, COMPLETION_GLOW_MS);
      Animated.parallel([
        Animated.timing(completionGlow, {
          toValue: 1,
          duration: glowMs,
          useNativeDriver: true,
        }),
        Animated.spring(checkScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 18,
          bounciness: reducedMotion ? 0 : 6,
        }),
      ]).start();
    } else {
      setPhaseSafe('idle');
    }
  }, [
    checkScale,
    checkSolved,
    completionGlow,
    gameStateRef,
    layout,
    markSolved,
    reducedMotion,
    setPhaseSafe,
    snapToBoard,
  ]);

  const handleTapTile = useCallback(
    async tileId => {
      if (!canInteract) {
        return;
      }
      const before = cloneBoardSnapshot(gameStateRef.current);
      const selectedBefore = before.selectedId;
      const result = applyTap(tileId);
      if (!result) {
        return;
      }
      if (result.accepted && selectedBefore && selectedBefore !== tileId) {
        setPhaseSafe('animating');
        const tileA = before.tiles.find(t => t.id === selectedBefore);
        const tileB = before.tiles.find(t => t.id === tileId);
        if (!tileA || !tileB) {
          setPhaseSafe('idle');
          return;
        }
        const fromA = cellOrigin(tileA.position, layout);
        const fromB = cellOrigin(tileB.position, layout);
        await animateSwap(
          gameStateRef.current,
          layout,
          selectedBefore,
          tileId,
          fromA,
          fromB,
        );
        AccessibilityInfo.announceForAccessibility('Tiles swapped');
        await finishSwapAnimation();
        return;
      }
      if (result.reason === 'selected') {
        await animateGrab(tileId);
      }
      if (result.reason === 'deselected') {
        await animateReleaseGrab(tileId);
      }
    },
    [
      animateGrab,
      animateReleaseGrab,
      animateSwap,
      applyTap,
      canInteract,
      finishSwapAnimation,
      gameStateRef,
      layout,
      setPhaseSafe,
    ],
  );

  const handleDropTiles = useCallback(
    async (dragId, targetId, finalDrag) => {
      if (!canInteract) {
        return;
      }
      setPhaseSafe('animating');
      const before = cloneBoardSnapshot(gameStateRef.current);
      const tileBeforeA = before.tiles.find(t => t.id === dragId);
      const tileBeforeB = before.tiles.find(t => t.id === targetId);
      if (!tileBeforeA || !tileBeforeB) {
        setActiveDrag(null);
        setDraggingId(null);
        setPhaseSafe('idle');
        return;
      }
      const fromA = cellOrigin(tileBeforeA.position, layout);
      const fromB = cellOrigin(tileBeforeB.position, layout);

      const result = applyDrop(dragId, targetId);
      if (result && result.accepted) {
        try {
          Vibration.vibrate(12);
        } catch (hapticError) {
          console.warn(
            'Swap haptic failed.',
            hapticError instanceof Error ? hapticError.message : hapticError,
          );
        }
        await animateSwap(
          gameStateRef.current,
          layout,
          dragId,
          targetId,
          fromA,
          fromB,
          finalDrag,
        );
        AccessibilityInfo.announceForAccessibility('Tiles swapped');
        setActiveDrag(null);
        setDraggingId(null);
        await finishSwapAnimation();
      } else {
        await animateReturn(gameStateRef.current, layout, dragId);
        setActiveDrag(null);
        setDraggingId(null);
        setPhaseSafe('idle');
      }
    },
    [
      animateReturn,
      animateSwap,
      applyDrop,
      canInteract,
      finishSwapAnimation,
      gameStateRef,
      layout,
      setActiveDrag,
      setPhaseSafe,
    ],
  );

  const handleCancelDrag = useCallback(
    async tileId => {
      setActiveDrag(null);
      setPhaseSafe('animating');
      await animateReturn(gameStateRef.current, layout, tileId);
      setDraggingId(null);
      setPhaseSafe('idle');
    },
    [animateReturn, gameStateRef, layout, setActiveDrag, setPhaseSafe],
  );

  const handleGrabStart = useCallback(
    tileId => {
      if (!canInteract) {
        return;
      }
      setActiveDrag(tileId);
      setDraggingId(tileId);
      animateGrab(tileId).catch(grabError => {
        console.warn(
          'Grab animation failed.',
          grabError instanceof Error ? grabError.message : grabError,
        );
      });
    },
    [animateGrab, canInteract, setActiveDrag],
  );

  const {panHandlers, cancelActive} = usePuzzleGestures({
    board,
    layout,
    boardRef: boardViewRef,
    canInteract,
    getMotion,
    onTapTile: handleTapTile,
    onDropTiles: handleDropTiles,
    onCancelDrag: handleCancelDrag,
    onHoverChange: setHoverId,
    onGrabStart: handleGrabStart,
  });

  // Geometry changes (e.g. screen dimension or orientation change):
  // safely cancel any active gesture, recalculate layout, and synchronize positions.
  useEffect(() => {
    const prev = prevLayoutRef.current;
    if (prev.boardPx !== layout.boardPx || prev.size !== layout.size) {
      prevLayoutRef.current = {boardPx: layout.boardPx, size: layout.size};
      cancelActive();
      ensureMap(gameStateRef.current);
      snapToBoard(gameStateRef.current, layout);
    }
  }, [cancelActive, ensureMap, gameStateRef, layout, snapToBoard]);

  const handleShuffle = useCallback(() => {
    if (!canInteract) {
      return;
    }
    completionGlow.setValue(0);
    checkScale.setValue(0);
    runScramble(Math.random);
  }, [canInteract, checkScale, completionGlow, runScramble]);

  const handleDifficulty = useCallback(
    nextDifficulty => {
      if (!canInteract || nextDifficulty === difficulty) {
        return;
      }
      completionGlow.setValue(0);
      checkScale.setValue(0);
      stopAll();
      const solved = startNewDifficulty(nextDifficulty);
      const nextLayout = createLayout(boardWidth, solved.size);
      ensureMap(solved);
      snapToBoard(solved, nextLayout, {force: true});
      runScramble(Math.random);
    },
    [
      boardWidth,
      canInteract,
      checkScale,
      completionGlow,
      difficulty,
      ensureMap,
      runScramble,
      snapToBoard,
      startNewDifficulty,
      stopAll,
    ],
  );

  const handleNewPuzzle = useCallback(async () => {
    completionGlow.setValue(0);
    checkScale.setValue(0);
    const previous = cloneBoardSnapshot(gameStateRef.current);
    setPhaseSafe('animating');
    const next = unlockAfterComplete(Math.random);
    await animateShuffle(previous, next, layout);
    snapToBoard(next, layout);
    setPhaseSafe('idle');
  }, [
    animateShuffle,
    checkScale,
    completionGlow,
    gameStateRef,
    layout,
    setPhaseSafe,
    snapToBoard,
    unlockAfterComplete,
  ]);

  const locked = !canInteract || phase === 'solved';

  return (
    <View style={[styles.root, {backgroundColor: colors.background, paddingTop: insets.top}]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={styles.back}>
          <Text style={[typography.bodyStrong, {color: colors.textSoft}]}>Back</Text>
        </Pressable>
        <Text style={[typography.screenTitle, {color: colors.text}]}>Puzzle lab</Text>
        <View style={styles.back} />
      </View>
      <View style={[styles.content, {paddingBottom: insets.bottom + spacing.lg}]}>
        <PuzzleHud
          difficulty={difficulty}
          disabled={!canInteract}
          moveCount={board.moveCount}
          onSelectDifficulty={handleDifficulty}
          onShuffle={handleShuffle}
        />
        <PuzzleBoard
          ref={boardViewRef}
          board={board}
          completionGlow={completionGlow}
          draggingId={draggingId}
          getMotion={getMotion}
          hoverId={hoverId}
          layout={layout}
          locked={locked}
          onAccessibilityActivate={handleTapTile}
          panHandlers={panHandlers}
          selectedId={board.selectedId}
        />
      </View>
      <PuzzleCompletion
        checkScale={checkScale}
        moveCount={board.moveCount}
        onNewPuzzle={handleNewPuzzle}
        visible={phase === 'solved'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  back: {
    minWidth: 64,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
});
