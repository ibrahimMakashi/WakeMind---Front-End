import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppIcon} from '../AppIcon';
import {spacing} from '../../constants/theme';
import {useTheme} from '../../theme/ThemeProvider';

function getTouchDistance(touches) {
  if (!touches || touches.length < 2) {
    return 0;
  }
  const [t1, t2] = touches;
  const dx = t1.pageX - t2.pageX;
  const dy = t1.pageY - t2.pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

export function ImageCropEditor({
  visible,
  image,
  onCancel,
  onChangeImage,
  onConfirmCrop,
  processing = false,
}) {
  const insets = useSafeAreaInsets();
  const {colors, typography, radius} = useTheme();
  const {width: windowWidth, height: windowHeight} = useWindowDimensions();

  // Square crop window size: responsive to screen
  const cropSizePx = Math.floor(Math.min(windowWidth - spacing.md * 2, windowHeight * 0.46, 360));

  const imgWidth = image?.width || 1024;
  const imgHeight = image?.height || 1024;

  // Aspect-fill base scale so image always completely covers the crop window at zoom=1.0
  const baseScale = useMemo(() => {
    return Math.max(cropSizePx / imgWidth, cropSizePx / imgHeight);
  }, [cropSizePx, imgHeight, imgWidth]);

  const baseW = imgWidth * baseScale;
  const baseH = imgHeight * baseScale;

  // Zoom state & animated value for 60fps GPU scaling
  const [displayZoom, setDisplayZoom] = useState(1.0);
  const zoomRef = useRef(1.0);
  const displayZoomRef = useRef(1.0);
  const animatedScale = useRef(new Animated.Value(1.0)).current;

  // Pan state & animated value
  const pan = useRef(new Animated.ValueXY({x: 0, y: 0})).current;
  const panOffsetRef = useRef({x: 0, y: 0});

  // Multi-touch tracking refs
  const isPinchActiveRef = useRef(false);
  const initialPinchDistRef = useRef(0);
  const initialPinchZoomRef = useRef(1.0);
  const lastTouchPosRef = useRef({x: 0, y: 0});

  // Calculate current display dimensions and pan limits for a given zoom level
  const calcLimits = useCallback(
    currentZoom => {
      const displayW = baseW * currentZoom;
      const displayH = baseH * currentZoom;
      const maxPanX = Math.max(0, (displayW - cropSizePx) / 2);
      const maxPanY = Math.max(0, (displayH - cropSizePx) / 2);
      return {displayW, displayH, maxPanX, maxPanY};
    },
    [baseH, baseW, cropSizePx],
  );

  // Clamp pan so no empty space appears inside the crop viewfinder
  const clampPan = useCallback(
    (x, y, currentZoom) => {
      const {maxPanX, maxPanY} = calcLimits(currentZoom);
      const clampedX = Math.min(maxPanX, Math.max(-maxPanX, x));
      const clampedY = Math.min(maxPanY, Math.max(-maxPanY, y));
      return {x: clampedX, y: clampedY};
    },
    [calcLimits],
  );

  // Reset to initial centered aspect-fill position
  const handleReset = useCallback(() => {
    zoomRef.current = 1.0;
    displayZoomRef.current = 1.0;
    animatedScale.setValue(1.0);
    panOffsetRef.current = {x: 0, y: 0};
    pan.setValue({x: 0, y: 0});
    setDisplayZoom(1.0);
  }, [animatedScale, pan]);

  useEffect(() => {
    if (visible) {
      handleReset();
    }
  }, [handleReset, visible, image?.uri]);

  // Gesture handling: continuous single-finger pan and two-finger pinch-to-zoom
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockAppendedTouches: () => true,

        onPanResponderGrant: evt => {
          const touches = evt.nativeEvent.touches;
          if (touches && touches.length >= 2) {
            isPinchActiveRef.current = true;
            initialPinchDistRef.current = getTouchDistance(touches);
            initialPinchZoomRef.current = zoomRef.current;
            lastTouchPosRef.current = {
              x: (touches[0].pageX + touches[1].pageX) / 2,
              y: (touches[0].pageY + touches[1].pageY) / 2,
            };
          } else if (touches && touches.length === 1) {
            isPinchActiveRef.current = false;
            initialPinchDistRef.current = 0;
            lastTouchPosRef.current = {
              x: touches[0].pageX,
              y: touches[0].pageY,
            };
          }
        },

        onPanResponderMove: evt => {
          const touches = evt.nativeEvent.touches;
          if (!touches || touches.length === 0) {
            return;
          }

          if (touches.length >= 2) {
            const dist = getTouchDistance(touches);
            const midX = (touches[0].pageX + touches[1].pageX) / 2;
            const midY = (touches[0].pageY + touches[1].pageY) / 2;

            if (!isPinchActiveRef.current || initialPinchDistRef.current <= 0) {
              // Second finger placed down: seamlessly start pinch
              isPinchActiveRef.current = true;
              initialPinchDistRef.current = dist > 0 ? dist : 1;
              initialPinchZoomRef.current = zoomRef.current;
              lastTouchPosRef.current = {x: midX, y: midY};
              return;
            }

            // Pinch zoom scale
            const ratio = dist / initialPinchDistRef.current;
            const nextZoom = Math.min(3.5, Math.max(1.0, initialPinchZoomRef.current * ratio));
            zoomRef.current = nextZoom;
            animatedScale.setValue(nextZoom);

            const roundedZoom = Number(nextZoom.toFixed(1));
            if (roundedZoom !== displayZoomRef.current) {
              displayZoomRef.current = roundedZoom;
              setDisplayZoom(roundedZoom);
            }

            // Two-finger pan delta
            const deltaX = midX - lastTouchPosRef.current.x;
            const deltaY = midY - lastTouchPosRef.current.y;
            lastTouchPosRef.current = {x: midX, y: midY};

            const targetX = panOffsetRef.current.x + deltaX;
            const targetY = panOffsetRef.current.y + deltaY;
            const clamped = clampPan(targetX, targetY, nextZoom);
            panOffsetRef.current = clamped;
            pan.setValue(clamped);
          } else if (touches.length === 1) {
            if (isPinchActiveRef.current) {
              // Lifted one finger of the pinch: transition back to single-finger drag
              isPinchActiveRef.current = false;
              initialPinchDistRef.current = 0;
              lastTouchPosRef.current = {
                x: touches[0].pageX,
                y: touches[0].pageY,
              };
              return;
            }

            // Single finger drag
            const deltaX = touches[0].pageX - lastTouchPosRef.current.x;
            const deltaY = touches[0].pageY - lastTouchPosRef.current.y;
            lastTouchPosRef.current = {
              x: touches[0].pageX,
              y: touches[0].pageY,
            };

            const targetX = panOffsetRef.current.x + deltaX;
            const targetY = panOffsetRef.current.y + deltaY;
            const clamped = clampPan(targetX, targetY, zoomRef.current);
            panOffsetRef.current = clamped;
            pan.setValue(clamped);
          }
        },

        onPanResponderRelease: () => {
          isPinchActiveRef.current = false;
          initialPinchDistRef.current = 0;
          const clamped = clampPan(panOffsetRef.current.x, panOffsetRef.current.y, zoomRef.current);
          panOffsetRef.current = clamped;
          pan.setValue(clamped);
          displayZoomRef.current = Number(zoomRef.current.toFixed(1));
          setDisplayZoom(Number(zoomRef.current.toFixed(1)));
        },

        onPanResponderTerminate: () => {
          isPinchActiveRef.current = false;
          initialPinchDistRef.current = 0;
          const clamped = clampPan(panOffsetRef.current.x, panOffsetRef.current.y, zoomRef.current);
          panOffsetRef.current = clamped;
          pan.setValue(clamped);
          displayZoomRef.current = Number(zoomRef.current.toFixed(1));
          setDisplayZoom(Number(zoomRef.current.toFixed(1)));
        },
      }),
    [animatedScale, clampPan, pan],
  );

  const handleZoomIn = () => {
    const next = Math.min(3.5, Number((zoomRef.current + 0.25).toFixed(2)));
    zoomRef.current = next;
    animatedScale.setValue(next);
    const clamped = clampPan(panOffsetRef.current.x, panOffsetRef.current.y, next);
    panOffsetRef.current = clamped;
    pan.setValue(clamped);
    setDisplayZoom(Number(next.toFixed(1)));
  };

  const handleZoomOut = () => {
    const next = Math.max(1.0, Number((zoomRef.current - 0.25).toFixed(2)));
    zoomRef.current = next;
    animatedScale.setValue(next);
    const clamped = clampPan(panOffsetRef.current.x, panOffsetRef.current.y, next);
    panOffsetRef.current = clamped;
    pan.setValue(clamped);
    setDisplayZoom(Number(next.toFixed(1)));
  };

  const handleConfirm = () => {
    if (processing || !image) {
      return;
    }
    const currentZoom = zoomRef.current;
    const {displayW, displayH} = calcLimits(currentZoom);
    const scaleFactor = imgWidth / displayW;
    const currentPan = panOffsetRef.current;

    // Viewport relative to top-left of image on screen
    const cropLeftInDisplay = (displayW - cropSizePx) / 2 - currentPan.x;
    const cropTopInDisplay = (displayH - cropSizePx) / 2 - currentPan.y;

    // Convert display viewport to source image coordinates
    const cropSizeOrig = cropSizePx * scaleFactor;
    const cropXOrig = cropLeftInDisplay * scaleFactor;
    const cropYOrig = cropTopInDisplay * scaleFactor;

    // Strictly clamp within source image dimensions
    const maxCropX = Math.max(0, imgWidth - cropSizeOrig);
    const maxCropY = Math.max(0, imgHeight - cropSizeOrig);
    const clampedCropX = Math.max(0, Math.min(maxCropX, cropXOrig));
    const clampedCropY = Math.max(0, Math.min(maxCropY, cropYOrig));

    onConfirmCrop({
      uri: image.uri,
      cropX: Math.round(clampedCropX),
      cropY: Math.round(clampedCropY),
      cropSize: Math.round(cropSizeOrig),
      title: image.title || 'Custom Photo',
    });
  };

  if (!visible || !image) {
    return null;
  }

  return (
    <Modal animationType="slide" onRequestClose={onCancel} visible={visible}>
      <View style={[styles.root, {backgroundColor: colors.background}]}>
        {/* Header with Safe Area Insets */}
        <View style={[styles.header, {paddingTop: Math.max(insets.top, 24) + spacing.xs}]}>
          <Pressable
            accessibilityLabel="Cancel crop"
            accessibilityRole="button"
            disabled={processing}
            onPress={onCancel}
            style={({pressed}) => [styles.headerButton, pressed && styles.pressed]}>
            <Text style={[typography.body, {color: colors.textSoft}]}>Cancel</Text>
          </Pressable>

          <Text style={[typography.screenTitle, {color: colors.text}]}>Crop Artwork</Text>

          <Pressable
            accessibilityLabel="Use Photo"
            accessibilityRole="button"
            disabled={processing}
            onPress={handleConfirm}
            style={({pressed}) => [
              styles.usePhotoButton,
              {
                backgroundColor: colors.accent,
                borderRadius: radius.pill,
              },
              pressed && styles.pressed,
              processing && styles.dimmed,
            ]}>
            {processing ? (
              <ActivityIndicator color={colors.accentText} size="small" />
            ) : (
              <Text style={[typography.button, {color: colors.accentText}]}>Use Photo</Text>
            )}
          </Pressable>
        </View>

        {/* Central Viewport with Crop Mask - panResponder attached to the whole canvas */}
        <View style={styles.cropStage} {...panResponder.panHandlers}>
          {/* Square Viewport (pointerEvents="none" so cropStage receives all touch gestures) */}
          <View
            pointerEvents="none"
            style={[
              styles.viewport,
              {
                width: cropSizePx,
                height: cropSizePx,
              },
            ]}>
            <Animated.Image
              resizeMode="stretch"
              source={{uri: image.uri}}
              style={[
                styles.cropImage,
                {
                  width: baseW,
                  height: baseH,
                  transform: [
                    {translateX: pan.x},
                    {translateY: pan.y},
                    {scale: animatedScale},
                  ],
                },
              ]}
            />

            {/* Grid overlay rule-of-thirds lines */}
            <View pointerEvents="none" style={styles.gridOverlay}>
              <View style={[styles.gridLineH1, {borderColor: colors.overlay}]} />
              <View style={[styles.gridLineH2, {borderColor: colors.overlay}]} />
              <View style={[styles.gridLineV1, {borderColor: colors.overlay}]} />
              <View style={[styles.gridLineV2, {borderColor: colors.overlay}]} />
            </View>

            {/* Viewport Border */}
            <View
              pointerEvents="none"
              style={[
                styles.viewportBorder,
                {
                  borderColor: colors.accent,
                },
              ]}
            />
          </View>

          <Text pointerEvents="none" style={[typography.caption, styles.dragHint, {color: colors.muted}]}>
            Drag to reposition • Pinch to zoom
          </Text>
        </View>

        {/* Footer with Zoom Controls and Change Image Option */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 16) + spacing.md,
            },
          ]}>
          <View style={styles.zoomRow}>
            <Pressable
              accessibilityLabel="Zoom out"
              accessibilityRole="button"
              disabled={displayZoom <= 1.0 || processing}
              onPress={handleZoomOut}
              style={({pressed}) => [
                styles.zoomButton,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                },
                pressed && styles.pressed,
                displayZoom <= 1.0 && styles.dimmed,
              ]}>
              <AppIcon color={colors.text} name="minus" size={20} />
            </Pressable>

            <View style={styles.zoomValueContainer}>
              <Text style={[typography.caption, styles.zoomText, {color: colors.textSoft}]}>
                {`${displayZoom.toFixed(1)}×`}
              </Text>
            </View>

            <Pressable
              accessibilityLabel="Zoom in"
              accessibilityRole="button"
              disabled={displayZoom >= 3.5 || processing}
              onPress={handleZoomIn}
              style={({pressed}) => [
                styles.zoomButton,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                },
                pressed && styles.pressed,
                displayZoom >= 3.5 && styles.dimmed,
              ]}>
              <AppIcon color={colors.text} name="plus" size={20} />
            </Pressable>

            <Pressable
              accessibilityLabel="Reset crop position"
              accessibilityRole="button"
              disabled={processing}
              onPress={handleReset}
              style={({pressed}) => [
                styles.resetButton,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                  borderRadius: radius.pill,
                },
                pressed && styles.pressed,
              ]}>
              <AppIcon color={colors.accent} name="refresh" size={16} />
              <Text style={[typography.caption, styles.resetText, {color: colors.accent}]}>
                Reset
              </Text>
            </Pressable>
          </View>

          {onChangeImage ? (
            <Pressable
              accessibilityLabel="Change Image"
              accessibilityRole="button"
              disabled={processing}
              onPress={onChangeImage}
              style={({pressed}) => [
                styles.changeImageButton,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                  borderRadius: radius.pill,
                },
                pressed && styles.pressed,
              ]}>
              <AppIcon color={colors.text} name="image-edit-outline" size={18} />
              <Text style={[typography.button, {color: colors.text}]}>Change Image</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerButton: {
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.sm,
  },
  usePhotoButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    minWidth: 96,
    paddingHorizontal: spacing.md,
  },
  cropStage: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  viewport: {
    alignItems: 'center',
    borderRadius: 16,
    elevation: 8,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  cropImage: {
    position: 'absolute',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH1: {
    borderTopWidth: StyleSheet.hairlineWidth,
    left: 0,
    position: 'absolute',
    right: 0,
    top: '33.33%',
  },
  gridLineH2: {
    borderTopWidth: StyleSheet.hairlineWidth,
    left: 0,
    position: 'absolute',
    right: 0,
    top: '66.66%',
  },
  gridLineV1: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    left: '33.33%',
    position: 'absolute',
    top: 0,
  },
  gridLineV2: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    left: '66.66%',
    position: 'absolute',
    top: 0,
  },
  viewportBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 2,
  },
  dragHint: {
    letterSpacing: 0.4,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  zoomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  zoomButton: {
    alignItems: 'center',
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  zoomValueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  zoomText: {
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  resetButton: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    height: 44,
    justifyContent: 'center',
    marginLeft: spacing.md,
    paddingHorizontal: spacing.md,
  },
  resetText: {
    fontWeight: '700',
  },
  changeImageButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 42,
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.7,
  },
  dimmed: {
    opacity: 0.4,
  },
});
