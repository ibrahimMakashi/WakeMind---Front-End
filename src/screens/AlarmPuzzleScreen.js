import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppIcon} from '../components/AppIcon';
import {PuzzleBoard} from '../components/puzzle/PuzzleBoard';
import {PuzzleProgressBar} from '../components/puzzle/PuzzleProgressBar';
import {spacing} from '../constants/theme';
import {usePuzzleGame} from '../hooks/usePuzzleGame';
import {usePuzzleGestures} from '../hooks/usePuzzleGestures';
import {useTileMotion} from '../hooks/useTileMotion';
import {DEFAULT_PUZZLE_IMAGE_ID, findImageById, resolveImageSource} from '../puzzle/imageCatalog';
import {getCustomImageById} from '../puzzle/imageStorage';
import {cellOrigin, createLayout} from '../puzzle/layout';
import {COMPLETION_GLOW_MS, COMPLETION_HAPTIC_MS, TILE_GAP_PX} from '../puzzle/motionConfig';
import {dismissAlarmAfterPuzzle} from '../services/alarmService';
import {motionDuration} from '../theme/motion';
import {useTheme} from '../theme/ThemeProvider';
import {usePrefersReducedMotion} from '../theme/usePrefersReducedMotion';

const BOARD_PADDING = 10;

function formatAlarmTime(triggerAtMillis) {
  const date = triggerAtMillis ? new Date(triggerAtMillis) : new Date();
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) {
    hours = 12;
  }
  const hoursStr = String(hours).padStart(2, '0');
  const minutesStr = String(minutes).padStart(2, '0');
  return `${hoursStr}:${minutesStr} ${period}`;
}

function cloneBoardSnapshot(board) {
  return {
    ...board,
    tiles: board.tiles.map(tile => ({...tile})),
  };
}

export function AlarmPuzzleScreen({
  alarmId = '',
  label = 'Alarm',
  triggerAtMillis = Date.now(),
  puzzleImageId = DEFAULT_PUZZLE_IMAGE_ID,
  puzzleImageType = 'bundled',
  difficulty = 'easy',
}) {
  const insets = useSafeAreaInsets();
  const {colors, typography} = useTheme();
  const reducedMotion = usePrefersReducedMotion();
  const {width, height} = useWindowDimensions();

  // Responsive board sizing: fits comfortably without scrolling
  const maxBoardHeight = Math.max(260, height - (insets.top + insets.bottom + 270));
  const outerBoardSize = Math.floor(Math.min(width - spacing.md * 2, maxBoardHeight, 380));
  const gridPx = Math.max(200, outerBoardSize - BOARD_PADDING * 2);

  // Suppress Android hardware back press completely during ringing alarm
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    return () => {
      stopAll();
    };
  }, [stopAll]);

  // Image resolution state
  const [activeImage, setActiveImage] = useState(() => {
    if (puzzleImageType === 'custom' && puzzleImageId) {
      return resolveImageSource(puzzleImageId, 'custom', '', 'Custom Photo');
    }
    const bundled = findImageById(puzzleImageId || DEFAULT_PUZZLE_IMAGE_ID);
    return resolveImageSource(bundled.id, 'bundled', '', bundled.title);
  });

  useEffect(() => {
    let cancelled = false;
    async function loadCustom() {
      if (puzzleImageType === 'custom' && puzzleImageId) {
        try {
          const custom = await getCustomImageById(puzzleImageId);
          if (!cancelled && custom && custom.uri) {
            setActiveImage(resolveImageSource(custom.id, 'custom', custom.uri, custom.title));
            return;
          }
        } catch (err) {
          console.warn('Failed to resolve custom image for alarm puzzle', err);
        }
      }
      if (!cancelled) {
        const bundled = findImageById(puzzleImageId || DEFAULT_PUZZLE_IMAGE_ID);
        setActiveImage(resolveImageSource(bundled.id, 'bundled', '', bundled.title));
      }
    }
    loadCustom();
    return () => {
      cancelled = true;
    };
  }, [puzzleImageId, puzzleImageType]);

  const {
    board,
    boardRef: gameStateRef,
    canInteract,
    applyTap,
    applyDrop,
    applyShuffle,
    checkSolved,
    markSolved,
    setPhaseSafe,
  } = usePuzzleGame(difficulty || 'easy');

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
    () => createLayout(gridPx, board.size, TILE_GAP_PX),
    [gridPx, board.size],
  );

  const boardViewRef = useRef(null);
  const [hoverId, setHoverId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [scrambled, setScrambled] = useState(false);
  const dismissingRef = useRef(false);

  const completionGlow = useRef(new Animated.Value(0)).current;
  const unlockBannerScale = useRef(new Animated.Value(0)).current;
  const initialSetupDoneRef = useRef(false);
  const mountedScrambleRef = useRef(false);

  // Timer
  useEffect(() => {
    if (isDismissed) {
      return;
    }
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isDismissed]);

  const runScramble = useCallback(
    async (random, targetLayout = layout) => {
      setPhaseSafe('animating');
      const previous = cloneBoardSnapshot(gameStateRef.current);
      const next = applyShuffle(random);
      await animateShuffle(previous, next, targetLayout);
      snapToBoard(next, targetLayout, {force: true});
      setScrambled(true);
      setPhaseSafe('idle');
    },
    [animateShuffle, applyShuffle, gameStateRef, layout, setPhaseSafe, snapToBoard],
  );

  // Initial board setup
  useEffect(() => {
    if (!initialSetupDoneRef.current) {
      initialSetupDoneRef.current = true;
      ensureMap(gameStateRef.current);
      snapToBoard(gameStateRef.current, layout);
    }
  }, [ensureMap, gameStateRef, layout, snapToBoard]);

  // Initial scramble on mount
  useEffect(() => {
    if (mountedScrambleRef.current) {
      return;
    }
    mountedScrambleRef.current = true;
    runScramble(Math.random).catch(scrambleError => {
      console.warn('Alarm puzzle scramble failed', scrambleError);
      setScrambled(false);
      setPhaseSafe('idle');
    });
  }, [runScramble, setPhaseSafe]);

  const handleRetryScramble = useCallback(() => {
    setScrambled(false);
    runScramble(Math.random).catch(scrambleError => {
      console.warn('Alarm puzzle scramble retry failed', scrambleError);
      setScrambled(false);
      setPhaseSafe('idle');
    });
  }, [runScramble, setPhaseSafe]);

  const handleAlarmSolved = useCallback(async () => {
    if (dismissingRef.current) {
      return;
    }
    dismissingRef.current = true;

    try {
      let dismissed = false;
      if (alarmId) {
        dismissed = await dismissAlarmAfterPuzzle(alarmId);
      } else {
        dismissed = true;
      }

      if (!dismissed) {
        console.warn(`Alarm puzzle dismissal was rejected by native engine for alarmId=${alarmId}`);
        dismissingRef.current = false;
        setPhaseSafe('idle');
        return;
      }

      markSolved();
      setIsDismissed(true);

      try {
        Vibration.vibrate(COMPLETION_HAPTIC_MS);
      } catch {
        // Ignore vibration error
      }

      AccessibilityInfo.announceForAccessibility('Alarm puzzle solved. Vision unlocked.');

      const glowMs = motionDuration(reducedMotion, COMPLETION_GLOW_MS);
      Animated.parallel([
        Animated.timing(completionGlow, {
          toValue: 1,
          duration: glowMs,
          useNativeDriver: true,
        }),
        Animated.spring(unlockBannerScale, {
          toValue: 1,
          speed: 18,
          bounciness: reducedMotion ? 0 : 6,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (dismissError) {
      console.warn('Alarm puzzle dismissal failed', dismissError);
      dismissingRef.current = false;
      setPhaseSafe('idle');
    }
  }, [alarmId, completionGlow, markSolved, reducedMotion, setPhaseSafe, unlockBannerScale]);

  const finishSwapAnimation = useCallback(async () => {
    snapToBoard(gameStateRef.current, layout);
    if (scrambled && checkSolved()) {
      await handleAlarmSolved();
    } else {
      setPhaseSafe('idle');
    }
  }, [checkSolved, gameStateRef, handleAlarmSolved, layout, scrambled, setPhaseSafe, snapToBoard]);

  const handleTapTile = useCallback(
    async tileId => {
      if (!canInteract || isDismissed) {
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
      isDismissed,
      layout,
      setPhaseSafe,
    ],
  );

  const handleDropTiles = useCallback(
    async (dragId, targetId, finalDrag) => {
      if (!canInteract || isDismissed) {
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
        } catch {
          // Ignore
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
      isDismissed,
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
      if (!canInteract || isDismissed) {
        return;
      }
      setActiveDrag(tileId);
      setDraggingId(tileId);
      animateGrab(tileId).catch(() => {});
    },
    [animateGrab, canInteract, isDismissed, setActiveDrag],
  );

  const {panHandlers} = usePuzzleGestures({
    board,
    layout,
    boardRef: boardViewRef,
    canInteract: canInteract && !isDismissed,
    getMotion,
    onTapTile: handleTapTile,
    onDropTiles: handleDropTiles,
    onCancelDrag: handleCancelDrag,
    onHoverChange: setHoverId,
    onGrabStart: handleGrabStart,
  });

  const formattedTime = useMemo(
    () => formatAlarmTime(triggerAtMillis),
    [triggerAtMillis],
  );

  const formatSeconds = sec => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const gridSizeText = `${board.size}×${board.size}`;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.sm,
          paddingBottom: insets.bottom + spacing.md,
        },
      ]}>
      {/* Top Header Card */}
      <View style={styles.header}>
        {/* Amber Vision Lock Eyebrow Badge */}
        <View
          style={[
            styles.lockBadge,
            {
              backgroundColor: isDismissed
                ? 'rgba(40, 167, 69, 0.16)'
                : 'rgba(245, 166, 35, 0.16)',
              borderColor: isDismissed ? '#28a745' : colors.accent,
            },
          ]}>
          <AppIcon
            color={isDismissed ? '#28a745' : colors.accent}
            name={isDismissed ? 'check-circle' : 'lock'}
            size={14}
          />
          <Text
            style={[
              typography.caption,
              styles.lockBadgeText,
              {color: isDismissed ? '#28a745' : colors.accent},
            ]}>
            {isDismissed ? 'VISION UNLOCKED' : 'VISION LOCK ACTIVE'}
          </Text>
        </View>

        {/* Huge Digital Alarm Time */}
        <Text style={[typography.heroTime, styles.timeText, {color: colors.text}]}>
          {formattedTime}
        </Text>

        {/* Alarm Label */}
        <Text
          numberOfLines={1}
          style={[typography.cardHeading, styles.labelText, {color: colors.textSoft}]}>
          {label || 'Wake-Up Vision Mission'}
        </Text>
      </View>

      {/* Mini Status Stats Strip */}
      <View
        style={[
          styles.hudStrip,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}>
        <View style={styles.hudStat}>
          <Text style={[typography.caption, styles.statLabel, {color: colors.muted}]}>
            MOVES
          </Text>
          <Text style={[typography.cardHeading, styles.statValue, {color: colors.text}]}>
            {board.moveCount}
          </Text>
        </View>
        <View style={[styles.hudDivider, {backgroundColor: colors.border}]} />
        <View style={styles.hudStat}>
          <Text style={[typography.caption, styles.statLabel, {color: colors.muted}]}>
            TIME
          </Text>
          <Text style={[typography.cardHeading, styles.statValue, {color: colors.text}]}>
            {formatSeconds(elapsedSeconds)}
          </Text>
        </View>
        <View style={[styles.hudDivider, {backgroundColor: colors.border}]} />
        <View style={styles.hudStat}>
          <Text style={[typography.caption, styles.statLabel, {color: colors.muted}]}>
            GRID
          </Text>
          <Text style={[typography.cardHeading, styles.statValue, {color: colors.text}]}>
            {gridSizeText}
          </Text>
        </View>
      </View>

      {/* Live Puzzle Progress Bar */}
      <PuzzleProgressBar
        board={board}
        ready={scrambled}
        style={styles.progressBar}
      />

      {!scrambled && !isDismissed && (
        <Pressable
          accessibilityLabel="Retry scrambling puzzle"
          accessibilityRole="button"
          onPress={handleRetryScramble}
          style={styles.retryWrap}>
          <Text style={[typography.caption, styles.retryText, {color: colors.accent}]}>
            Setup incomplete • Tap to retry scramble
          </Text>
        </Pressable>
      )}

      {/* Main Puzzle Board Area */}
      <View style={styles.boardWrap}>
        <PuzzleBoard
          ref={boardViewRef}
          board={board}
          boardPadding={BOARD_PADDING}
          completionGlow={completionGlow}
          draggingId={draggingId}
          getMotion={getMotion}
          hoverId={hoverId}
          imageSource={activeImage.source}
          layout={layout}
          locked={!canInteract || isDismissed}
          onAccessibilityActivate={handleTapTile}
          panHandlers={panHandlers}
          selectedId={board.selectedId}
        />

        {/* Bottom Instruction or Unlock Banner */}
        {isDismissed ? (
          <Animated.View
            style={[
              styles.unlockedCard,
              {
                backgroundColor: colors.surfaceRaised,
                borderColor: '#28a745',
                transform: [{scale: unlockBannerScale}],
              },
            ]}>
            <AppIcon color="#28a745" name="check-circle" size={28} />
            <View style={styles.unlockedTextWrap}>
              <Text style={[typography.cardHeading, {color: colors.text}]}>
                Alarm Dismissed!
              </Text>
              <Text style={[typography.caption, {color: colors.textSoft}]}>
                Your morning starts now. Vision unlocked.
              </Text>
            </View>
          </Animated.View>
        ) : (
          <Text style={[typography.caption, styles.instructionText, {color: colors.muted}]}>
            Arrange all tiles to unlock your morning
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  header: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    width: '100%',
  },
  lockBadge: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  lockBadgeText: {
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  timeText: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  labelText: {
    letterSpacing: 0.5,
  },
  hudStrip: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    maxWidth: 380,
    paddingVertical: spacing.xs + 2,
    width: '100%',
  },
  hudStat: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  hudDivider: {
    height: 24,
    width: StyleSheet.hairlineWidth,
  },
  progressBar: {
    maxWidth: 380,
    paddingHorizontal: spacing.xs,
  },
  retryWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  boardWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  instructionText: {
    letterSpacing: 0.4,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  unlockedCard: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    maxWidth: 360,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: '100%',
  },
  unlockedTextWrap: {
    flex: 1,
  },
});
