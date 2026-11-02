import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
  useWindowDimensions,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppIcon} from '../components/AppIcon';
import {ArtworkBanner} from '../components/puzzle/ArtworkBanner';
import {ImageCropEditor} from '../components/puzzle/ImageCropEditor';
import {ImageGalleryModal} from '../components/puzzle/ImageGalleryModal';
import {PuzzleBoard} from '../components/puzzle/PuzzleBoard';
import {PuzzleCompletion} from '../components/puzzle/PuzzleCompletion';
import {PuzzleHud} from '../components/puzzle/PuzzleHud';
import {spacing} from '../constants/theme';
import {usePuzzleGame} from '../hooks/usePuzzleGame';
import {usePuzzleGestures} from '../hooks/usePuzzleGestures';
import {usePuzzleImage} from '../hooks/usePuzzleImage';
import {useTileMotion} from '../hooks/useTileMotion';
import {cellOrigin, createLayout} from '../puzzle/layout';
import {COMPLETION_GLOW_MS, COMPLETION_HAPTIC_MS, TILE_GAP_PX} from '../puzzle/motionConfig';
import {motionDuration} from '../theme/motion';
import {useTheme} from '../theme/ThemeProvider';
import {usePrefersReducedMotion} from '../theme/usePrefersReducedMotion';

const BOARD_PADDING = 10;

function cloneBoardSnapshot(board) {
  return {
    ...board,
    tiles: board.tiles.map(tile => ({...tile})),
  };
}

export function PuzzleScreen() {
  const navigation = useNavigation();
  let routeParams = null;
  try {
    const route = useRoute();
    routeParams = route?.params;
  } catch {
    routeParams = null;
  }
  const previewImage = routeParams?.previewImage;
  const previewDifficulty = routeParams?.previewDifficulty;
  const isPreview = Boolean(previewImage || previewDifficulty);

  const insets = useSafeAreaInsets();
  const {colors, typography} = useTheme();
  const reducedMotion = usePrefersReducedMotion();
  const {width, height} = useWindowDimensions();

  // Responsive board sizing: fits comfortably without scrolling
  const maxBoardHeight = Math.max(260, height - (insets.top + insets.bottom + 290));
  const outerBoardSize = Math.floor(Math.min(width - spacing.md * 2, maxBoardHeight, 380));
  const gridPx = Math.max(200, outerBoardSize - BOARD_PADDING * 2);

  const {
    currentImage,
    recentImages,
    loading: imageLoading,
    selectBundled,
    selectRecent,
    chooseFromPhone,
    confirmCroppedImage,
  } = usePuzzleImage();

  const activeImage = isPreview && previewImage ? previewImage : currentImage;

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
  } = usePuzzleGame(previewDifficulty || 'easy');

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
  const [previewVisible, setPreviewVisible] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [cropVisible, setCropVisible] = useState(false);
  const [pendingCropImage, setPendingCropImage] = useState(null);
  const [cropProcessing, setCropProcessing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const completionGlow = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const mountedScrambleRef = useRef(false);
  const initialSetupDoneRef = useRef(false);
  const prevLayoutRef = useRef({boardPx: layout.boardPx, size: layout.size});
  const scrollViewRef = useRef(null);

  // Auto-scroll to completion section when puzzle is solved
  useEffect(() => {
    if (phase === 'solved') {
      const scrollTimer = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({animated: true});
      }, 200);
      return () => clearTimeout(scrollTimer);
    } else {
      scrollViewRef.current?.scrollTo({y: 0, animated: false});
    }
  }, [phase]);

  // Real game timer
  const isTimerActive = phase !== 'solved' && board.moveCount > 0;
  useEffect(() => {
    if (!isTimerActive) {
      return;
    }
    const timerInterval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [isTimerActive]);

  const runScramble = useCallback(
    async (random, targetLayout = layout) => {
      setPhaseSafe('animating');
      const previous = cloneBoardSnapshot(gameStateRef.current);
      const next = applyShuffle(random);
      await animateShuffle(previous, next, targetLayout);
      snapToBoard(next, targetLayout, {force: true});
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
          speed: 22,
          bounciness: reducedMotion ? 0 : 4,
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
      snapToBoard(gameStateRef.current, layout, {force: true});
    }
  }, [cancelActive, ensureMap, gameStateRef, layout, snapToBoard]);

  const handleShuffle = useCallback(() => {
    if (!canInteract) {
      return;
    }
    setElapsedSeconds(0);
    completionGlow.setValue(0);
    checkScale.setValue(0);
    runScramble(Math.random);
  }, [canInteract, checkScale, completionGlow, runScramble]);

  const handleDifficulty = useCallback(
    nextDifficulty => {
      if (!canInteract || nextDifficulty === difficulty) {
        return;
      }
      setElapsedSeconds(0);
      completionGlow.setValue(0);
      checkScale.setValue(0);
      stopAll();
      const newBoard = startNewDifficulty(nextDifficulty, Math.random);
      const nextLayout = createLayout(gridPx, newBoard.size, TILE_GAP_PX);
      prevLayoutRef.current = {boardPx: nextLayout.boardPx, size: nextLayout.size};
      ensureMap(newBoard);
      snapToBoard(newBoard, nextLayout, {force: true});
      setPhaseSafe('idle');
    },
    [
      canInteract,
      checkScale,
      completionGlow,
      difficulty,
      ensureMap,
      gridPx,
      setPhaseSafe,
      snapToBoard,
      startNewDifficulty,
      stopAll,
    ],
  );

  const handleNewPuzzle = useCallback(async () => {
    setElapsedSeconds(0);
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

  // Handle switching to a bundled image
  const handleSelectBundledImage = useCallback(
    async id => {
      setGalleryVisible(false);
      await selectBundled(id);
      // Reset game state for fresh image
      setElapsedSeconds(0);
      completionGlow.setValue(0);
      checkScale.setValue(0);
      stopAll();
      const solved = startNewDifficulty(difficulty);
      prevLayoutRef.current = {boardPx: layout.boardPx, size: layout.size};
      ensureMap(solved);
      snapToBoard(solved, layout, {force: true});
      runScramble(Math.random, layout);
    },
    [
      completionGlow,
      checkScale,
      difficulty,
      ensureMap,
      layout,
      runScramble,
      selectBundled,
      snapToBoard,
      startNewDifficulty,
      stopAll,
    ],
  );

  const handleSelectRecentImage = useCallback(
    async image => {
      setGalleryVisible(false);
      await selectRecent(image);
      // Reset game state for fresh image
      setElapsedSeconds(0);
      completionGlow.setValue(0);
      checkScale.setValue(0);
      stopAll();
      const solved = startNewDifficulty(difficulty);
      prevLayoutRef.current = {boardPx: layout.boardPx, size: layout.size};
      ensureMap(solved);
      snapToBoard(solved, layout, {force: true});
      runScramble(Math.random, layout);
    },
    [
      checkScale,
      completionGlow,
      difficulty,
      ensureMap,
      layout,
      runScramble,
      selectRecent,
      snapToBoard,
      startNewDifficulty,
      stopAll,
    ],
  );

  // Handle choosing photo from phone
  const handleChooseFromPhone = useCallback(async () => {
    const picked = await chooseFromPhone();
    if (picked && picked.uri) {
      setGalleryVisible(false);
      setPendingCropImage(picked);
      setCropVisible(true);
    }
  }, [chooseFromPhone]);

  // Handle confirming square crop
  const handleConfirmCrop = useCallback(
    async cropParams => {
      setCropProcessing(true);
      try {
        await confirmCroppedImage(cropParams);
        setCropProcessing(false);
        setCropVisible(false);
        setPendingCropImage(null);

        // Reset puzzle with new custom artwork
        setElapsedSeconds(0);
        completionGlow.setValue(0);
        checkScale.setValue(0);
        stopAll();
        const solved = startNewDifficulty(difficulty);
        prevLayoutRef.current = {boardPx: layout.boardPx, size: layout.size};
        ensureMap(solved);
        snapToBoard(solved, layout, {force: true});
        runScramble(Math.random, layout);
      } catch (cropError) {
        setCropProcessing(false);
        console.warn('Crop confirmation failed', cropError);
      }
    },
    [
      confirmCroppedImage,
      completionGlow,
      checkScale,
      difficulty,
      ensureMap,
      layout,
      runScramble,
      snapToBoard,
      startNewDifficulty,
      stopAll,
    ],
  );

  const locked = !canInteract || phase === 'solved';

  return (
    <View style={[styles.root, {backgroundColor: colors.background, paddingTop: insets.top}]}>
      {/* Top Navigation Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={({pressed}) => [
            styles.headerButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            pressed && styles.buttonPressed,
          ]}>
          <AppIcon color={colors.text} name="arrow-left" size={20} />
        </Pressable>

        <View style={styles.titleWrap}>
          <Text style={[typography.screenTitle, styles.titleText, {color: colors.text}]}>
            {isPreview ? 'Wake-Up Test' : 'Puzzle lab'}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Preview reference image"
          accessibilityHint="Shows the complete reference artwork"
          onPress={() => setPreviewVisible(true)}
          style={({pressed}) => [
            styles.headerButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            pressed && styles.buttonPressed,
          ]}>
          <AppIcon color={colors.accent} name="eye-outline" size={20} />
        </Pressable>
      </View>

      {/* Main Content Area - Scrollable when solved so completion card is fully accessible */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + spacing.xl + 48}]}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={phase === 'solved'}
        showsVerticalScrollIndicator={false}
        style={styles.scrollArea}>
        {/* Artwork Selection Banner */}
        <ArtworkBanner
          currentImage={activeImage}
          disabled={!canInteract || isPreview}
          onChangePress={() => setGalleryVisible(true)}
        />

        {/* Game Status & Controls */}
        <PuzzleHud
          difficulty={difficulty}
          disabled={!canInteract}
          elapsedSeconds={elapsedSeconds}
          moveCount={board.moveCount}
          onPreview={() => setPreviewVisible(true)}
          onSelectDifficulty={handleDifficulty}
          onShuffle={handleShuffle}
        />

        {/* Puzzle Board Container */}
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
          locked={locked}
          onAccessibilityActivate={handleTapTile}
          panHandlers={locked ? {} : panHandlers}
          selectedId={board.selectedId}
        />

        <Text style={[typography.caption, styles.hintText, {color: colors.muted}]}>
          Drag to swap tiles • Tap two tiles to swap
        </Text>

        {/* Solved Completion Section */}
        <PuzzleCompletion
          checkScale={checkScale}
          moveCount={board.moveCount}
          onNewPuzzle={handleNewPuzzle}
          visible={phase === 'solved'}
        />
      </ScrollView>

      {/* Image Gallery Selection Modal */}
      <ImageGalleryModal
        currentImageId={currentImage.id}
        loading={imageLoading}
        onChooseFromPhone={handleChooseFromPhone}
        onClose={() => setGalleryVisible(false)}
        onSelectBundled={handleSelectBundledImage}
        onSelectRecent={handleSelectRecentImage}
        recentImages={recentImages}
        visible={galleryVisible}
      />

      {/* Square Crop Editor Modal */}
      <ImageCropEditor
        image={pendingCropImage}
        onCancel={() => {
          setCropVisible(false);
          setPendingCropImage(null);
        }}
        onChangeImage={handleChooseFromPhone}
        onConfirmCrop={handleConfirmCrop}
        processing={cropProcessing}
        visible={cropVisible}
      />

      {/* Dynamic Reference Image Preview Modal */}
      <Modal
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
        transparent
        visible={previewVisible}>
        <Pressable
          accessibilityLabel="Close preview"
          onPress={() => setPreviewVisible(false)}
          style={styles.modalBackdrop}>
          <Pressable
            onPress={e => e.stopPropagation()}
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surfaceRaised,
                borderColor: colors.border,
                maxWidth: Math.min(width - 48, 360),
              },
            ]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <AppIcon color={colors.accent} name="image-outline" size={18} />
                <Text style={[typography.cardHeading, styles.modalTitle, {color: colors.text}]}>
                  {activeImage?.title ? activeImage.title.toUpperCase() : 'REFERENCE ARTWORK'}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close"
                accessibilityRole="button"
                onPress={() => setPreviewVisible(false)}
                style={({pressed}) => [
                  styles.modalCloseButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  pressed && styles.buttonPressed,
                ]}>
                <AppIcon color={colors.textSoft} name="close" size={18} />
              </Pressable>
            </View>

            <View style={styles.modalImageContainer}>
              <Image
                resizeMode="cover"
                source={activeImage.source}
                style={[
                  styles.modalImage,
                  {
                    width: Math.min(width - 80, 320),
                    height: Math.min(width - 80, 320),
                  },
                ]}
              />
            </View>

            <Text style={[typography.caption, styles.modalFooterText, {color: colors.muted}]}>
              Tap anywhere to dismiss
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
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
  headerButton: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  titleWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    paddingHorizontal: spacing.md,
  },
  hintText: {
    letterSpacing: 0.3,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalCard: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.md,
    width: '100%',
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    width: '100%',
  },
  modalHeaderLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  modalTitle: {
    letterSpacing: 1.2,
  },
  modalCloseButton: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  modalImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalImage: {
    borderRadius: 12,
  },
  modalFooterText: {
    letterSpacing: 0.4,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
