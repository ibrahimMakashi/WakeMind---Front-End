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

  const game = usePuzzleGame('easy');
  const motion = useTileMotion(reducedMotion);
  const layout = useMemo(
    () => createLayout(boardWidth, game.board.size),
    [boardWidth, game.board.size],
  );

  // boardRef is passed directly to usePuzzleGestures so it can call
  // measureInWindow inline on each grant. No cache is maintained here.
  const boardRef = useRef(null);
  const [hoverId, setHoverId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const completionGlow = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const mountedScrambleRef = useRef(false);

  const runScramble = useCallback(
    async random => {
      game.setPhaseSafe('animating');
      const previous = cloneBoardSnapshot(game.boardRef.current);
      const next = game.applyShuffle(random);
      await motion.animateShuffle(previous, next, layout);
      motion.snapToBoard(next, layout);
      game.setPhaseSafe('idle');
    },
    [game, layout, motion],
  );

  useEffect(() => {
    motion.ensureMap(game.board);
    motion.snapToBoard(game.board, layout);
  }, [game.board, layout, motion]);

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
      game.setPhaseSafe('idle');
    });
    // Initial scramble only on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishSwapAnimation = useCallback(async () => {
    motion.snapToBoard(game.boardRef.current, layout);
    if (game.checkSolved()) {
      game.markSolved();
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
      game.setPhaseSafe('idle');
    }
  }, [checkScale, completionGlow, game, layout, motion, reducedMotion]);

  const handleTapTile = useCallback(
    async tileId => {
      if (!game.canInteract) {
        return;
      }
      const before = cloneBoardSnapshot(game.boardRef.current);
      const selectedBefore = before.selectedId;
      const result = game.applyTap(tileId);
      if (!result) {
        return;
      }
      if (result.accepted && selectedBefore && selectedBefore !== tileId) {
        game.setPhaseSafe('animating');
        const fromA = cellOrigin(
          before.tiles.find(t => t.id === selectedBefore).position,
          layout,
        );
        const fromB = cellOrigin(
          before.tiles.find(t => t.id === tileId).position,
          layout,
        );
        await motion.animateSwap(
          game.boardRef.current,
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
        await motion.animateGrab(tileId);
      }
      if (result.reason === 'deselected') {
        await motion.animateReleaseGrab(tileId);
      }
    },
    [finishSwapAnimation, game, layout, motion],
  );

  const handleDropTiles = useCallback(
    async (dragId, targetId) => {
      if (!game.canInteract) {
        return;
      }
      const before = cloneBoardSnapshot(game.boardRef.current);
      const fromA = cellOrigin(
        before.tiles.find(t => t.id === dragId).position,
        layout,
      );
      const fromB = cellOrigin(
        before.tiles.find(t => t.id === targetId).position,
        layout,
      );
      game.setPhaseSafe('animating');
      setDraggingId(null);
      const result = game.applyDrop(dragId, targetId);
      if (result && result.accepted) {
        try {
          Vibration.vibrate(12);
        } catch (hapticError) {
          console.warn(
            'Swap haptic failed.',
            hapticError instanceof Error ? hapticError.message : hapticError,
          );
        }
        await motion.animateSwap(
          game.boardRef.current,
          layout,
          dragId,
          targetId,
          fromA,
          fromB,
        );
        AccessibilityInfo.announceForAccessibility('Tiles swapped');
        await finishSwapAnimation();
      } else {
        await motion.animateReturn(game.boardRef.current, layout, dragId);
        game.setPhaseSafe('idle');
      }
    },
    [finishSwapAnimation, game, layout, motion],
  );

  const handleCancelDrag = useCallback(
    async tileId => {
      setDraggingId(null);
      game.setPhaseSafe('animating');
      await motion.animateReturn(game.boardRef.current, layout, tileId);
      game.setPhaseSafe('idle');
    },
    [game, layout, motion],
  );

  const handleGrabStart = useCallback(
    tileId => {
      if (!game.canInteract) {
        return;
      }
      setDraggingId(tileId);
      motion.animateGrab(tileId).catch(grabError => {
        console.warn(
          'Grab animation failed.',
          grabError instanceof Error ? grabError.message : grabError,
        );
      });
    },
    [game.canInteract, motion],
  );

  const {panHandlers} = usePuzzleGestures({
    board: game.board,
    layout,
    boardRef,
    canInteract: game.canInteract,
    getMotion: motion.getMotion,
    onTapTile: handleTapTile,
    onDropTiles: handleDropTiles,
    onCancelDrag: handleCancelDrag,
    onHoverChange: setHoverId,
    onGrabStart: handleGrabStart,
  });

  const handleShuffle = useCallback(() => {
    if (!game.canInteract) {
      return;
    }
    completionGlow.setValue(0);
    checkScale.setValue(0);
    runScramble(Math.random);
  }, [checkScale, completionGlow, game.canInteract, runScramble]);

  const handleDifficulty = useCallback(
    nextDifficulty => {
      if (!game.canInteract || nextDifficulty === game.difficulty) {
        return;
      }
      completionGlow.setValue(0);
      checkScale.setValue(0);
      motion.stopAll();
      const solved = game.startNewDifficulty(nextDifficulty);
      const nextLayout = createLayout(boardWidth, solved.size);
      motion.ensureMap(solved);
      motion.snapToBoard(solved, nextLayout);
      runScramble(Math.random);
    },
    [boardWidth, checkScale, completionGlow, game, motion, runScramble],
  );

  const handleNewPuzzle = useCallback(async () => {
    completionGlow.setValue(0);
    checkScale.setValue(0);
    const previous = cloneBoardSnapshot(game.boardRef.current);
    game.setPhaseSafe('animating');
    const next = game.unlockAfterComplete(Math.random);
    await motion.animateShuffle(previous, next, layout);
    motion.snapToBoard(next, layout);
    game.setPhaseSafe('idle');
  }, [checkScale, completionGlow, game, layout, motion]);

  const locked = !game.canInteract || game.phase === 'solved';

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
          difficulty={game.difficulty}
          disabled={!game.canInteract}
          moveCount={game.board.moveCount}
          onSelectDifficulty={handleDifficulty}
          onShuffle={handleShuffle}
        />
        <PuzzleBoard
          ref={boardRef}
          board={game.board}
          completionGlow={completionGlow}
          draggingId={draggingId}
          getMotion={motion.getMotion}
          hoverId={hoverId}
          layout={layout}
          locked={locked}
          onAccessibilityActivate={handleTapTile}
          panHandlers={panHandlers}
          selectedId={game.board.selectedId}
        />
      </View>
      <PuzzleCompletion
        checkScale={checkScale}
        moveCount={game.board.moveCount}
        onNewPuzzle={handleNewPuzzle}
        visible={game.phase === 'solved'}
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
