import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppIcon} from '../../components/AppIcon';
import {spacing} from '../../constants/theme';
import {useTheme} from '../../theme/ThemeProvider';
import {cropSquareImage, recordRecentImage} from '../../puzzle/imageStorage';

function getTouchDistance(touches) {
  if (!touches || touches.length < 2) {
    return 0;
  }
  const [t1, t2] = touches;
  const dx = t1.pageX - t2.pageX;
  const dy = t1.pageY - t2.pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

export function ImageEditorScreen({
  image: propImage,
  onApply: propOnApply,
  onCancel: propOnCancel,
}) {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const {colors, typography, radius} = useTheme();
  const {width: windowWidth, height: windowHeight} = useWindowDimensions();

  // Support both stack route params and direct component props
  const image = propImage || route.params?.image || null;
  const routeOnApply = route.params?.onApply;

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Square crop window size: responsive to screen width and height
  const cropSizePx = Math.floor(
    Math.min(windowWidth - spacing.lg * 2, windowHeight * 0.46, 360),
  );

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
    setError('');
  }, [animatedScale, pan]);

  useEffect(() => {
    handleReset();
  }, [handleReset, image?.uri]);

  // Gesture handling: single-finger pan and two-finger pinch-to-zoom
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => false,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockAppendedTouches: () => false,

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
              isPinchActiveRef.current = true;
              initialPinchDistRef.current = dist > 0 ? dist : 1;
              initialPinchZoomRef.current = zoomRef.current;
              lastTouchPosRef.current = {x: midX, y: midY};
              return;
            }

            const ratio = dist / initialPinchDistRef.current;
            const nextZoom = Math.min(3.5, Math.max(1.0, initialPinchZoomRef.current * ratio));
            zoomRef.current = nextZoom;
            animatedScale.setValue(nextZoom);

            const roundedZoom = Number(nextZoom.toFixed(1));
            if (roundedZoom !== displayZoomRef.current) {
              displayZoomRef.current = roundedZoom;
              setDisplayZoom(roundedZoom);
            }

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
              isPinchActiveRef.current = false;
              initialPinchDistRef.current = 0;
              lastTouchPosRef.current = {
                x: touches[0].pageX,
                y: touches[0].pageY,
              };
              return;
            }

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

  const handleCancel = () => {
    if (processing) {
      return;
    }
    if (propOnCancel) {
      propOnCancel();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleApply = async () => {
    if (processing || !image) {
      return;
    }
    setProcessing(true);
    setError('');

    try {
      const currentZoom = zoomRef.current;
      const {displayW, displayH} = calcLimits(currentZoom);
      const scaleFactor = imgWidth / displayW;
      const currentPan = panOffsetRef.current;

      const cropLeftInDisplay = (displayW - cropSizePx) / 2 - currentPan.x;
      const cropTopInDisplay = (displayH - cropSizePx) / 2 - currentPan.y;

      const cropSizeOrig = cropSizePx * scaleFactor;
      const cropXOrig = cropLeftInDisplay * scaleFactor;
      const cropYOrig = cropTopInDisplay * scaleFactor;

      const maxCropX = Math.max(0, imgWidth - cropSizeOrig);
      const maxCropY = Math.max(0, imgHeight - cropSizeOrig);
      const clampedCropX = Math.max(0, Math.min(maxCropX, cropXOrig));
      const clampedCropY = Math.max(0, Math.min(maxCropY, cropYOrig));

      const cropped = await cropSquareImage({
        uri: image.uri,
        cropX: Math.round(clampedCropX),
        cropY: Math.round(clampedCropY),
        cropSize: Math.round(cropSizeOrig),
        targetSize: 1024,
      });

      const processedImage = {
        id: cropped.id,
        type: 'custom',
        title: image.title || 'Custom Photo',
        uri: cropped.uri,
        source: {uri: cropped.uri},
      };

      await recordRecentImage(processedImage);

      setProcessing(false);

      if (propOnApply) {
        propOnApply(processedImage);
      } else if (routeOnApply) {
        routeOnApply(processedImage);
        navigation.goBack();
      } else if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (err) {
      setProcessing(false);
      setError(err?.message || 'Failed to crop and save the image.');
    }
  };

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
          paddingTop: Math.max(insets.top, 24) + spacing.xs,
          paddingBottom: Math.max(insets.bottom, 16) + spacing.md,
        },
      ]}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Cancel crop"
          accessibilityRole="button"
          disabled={processing}
          onPress={handleCancel}
          style={({pressed}) => [styles.headerButton, pressed && styles.pressed]}>
          <Text style={[typography.bodyStrong, {color: colors.textSoft}]}>Cancel</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={[typography.bodyStrong, styles.headerTitle, {color: colors.text}]}>
            Crop & Position Photo
          </Text>
          <Text style={[typography.caption, styles.headerSubtitle, {color: colors.accent}]}>
            PUZZLE ARTWORK SELECTION
          </Text>
        </View>

        <Pressable
          accessibilityLabel="Apply crop"
          accessibilityRole="button"
          disabled={processing}
          onPress={handleApply}
          style={({pressed}) => [
            styles.applyButton,
            {
              backgroundColor: colors.accent,
              borderRadius: radius.pill,
            },
            processing && styles.disabled,
            pressed && !processing && styles.pressed,
          ]}>
          <Text style={[typography.button, styles.applyText, {color: colors.accentText}]}>
            {processing ? 'Saving…' : 'Apply'}
          </Text>
        </Pressable>
      </View>

      {/* Main Viewfinder Section */}
      <View style={styles.viewfinderContainer}>
        {image ? (
          <View
            style={[
              styles.cropWindow,
              {
                width: cropSizePx,
                height: cropSizePx,
                borderRadius: radius.md,
                borderColor: colors.accent,
              },
            ]}>
            {/* Movable & Zoomable Image */}
            <Animated.Image
              fadeDuration={0}
              resizeMode="cover"
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

            {/* Subtle Rule-of-Thirds Grid Overlay */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <View style={[styles.gridH, {top: '33.33%'}]} />
              <View style={[styles.gridH, {top: '66.66%'}]} />
              <View style={[styles.gridV, {left: '33.33%'}]} />
              <View style={[styles.gridV, {left: '66.66%'}]} />
            </View>

            {/* Touch Capture Layer */}
            <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers} />

            {/* Corner Bracket Accents */}
            <View pointerEvents="none" style={[styles.corner, styles.cornerTL, {borderColor: colors.accent}]} />
            <View pointerEvents="none" style={[styles.corner, styles.cornerTR, {borderColor: colors.accent}]} />
            <View pointerEvents="none" style={[styles.corner, styles.cornerBL, {borderColor: colors.accent}]} />
            <View pointerEvents="none" style={[styles.corner, styles.cornerBR, {borderColor: colors.accent}]} />
          </View>
        ) : (
          <View style={styles.noImagePlaceholder}>
            <AppIcon color={colors.muted} name="image-broken-variant" size={48} />
            <Text style={[typography.caption, {color: colors.muted, marginTop: spacing.sm}]}>
              No image selected
            </Text>
          </View>
        )}

        {/* Current Zoom Indicator */}
        <View
          style={[
            styles.zoomBadge,
            {
              backgroundColor: 'rgba(11, 16, 32, 0.85)',
              borderColor: colors.border,
            },
          ]}>
          <Text style={[typography.caption, styles.zoomText, {color: colors.textSoft}]}>
            {displayZoom.toFixed(1)}× Zoom
          </Text>
        </View>
      </View>

      {/* Error Message */}
      {error ? (
        <Text style={[typography.caption, styles.errorText, {color: colors.error || '#FF5555'}]}>
          {error}
        </Text>
      ) : null}

      {/* Bottom Controls Bar */}
      <View style={styles.controlsBar}>
        <Pressable
          accessibilityLabel="Reset crop"
          accessibilityRole="button"
          disabled={processing}
          onPress={handleReset}
          style={({pressed}) => [
            styles.toolButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
            },
            pressed && styles.pressed,
          ]}>
          <AppIcon color={colors.textSoft} name="restore" size={18} />
          <Text style={[typography.caption, styles.toolLabel, {color: colors.textSoft}]}>
            Reset
          </Text>
        </Pressable>

        {/* Zoom In/Out Buttons */}
        <View
          style={[
            styles.zoomButtonGroup,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
            },
          ]}>
          <Pressable
            accessibilityLabel="Zoom out"
            accessibilityRole="button"
            disabled={processing || displayZoom <= 1.0}
            onPress={handleZoomOut}
            style={({pressed}) => [
              styles.zoomStepButton,
              pressed && styles.pressed,
              displayZoom <= 1.0 && styles.disabled,
            ]}>
            <AppIcon color={colors.text} name="minus" size={18} />
          </Pressable>
          <View style={[styles.zoomDivider, {backgroundColor: colors.border}]} />
          <Pressable
            accessibilityLabel="Zoom in"
            accessibilityRole="button"
            disabled={processing || displayZoom >= 3.5}
            onPress={handleZoomIn}
            style={({pressed}) => [
              styles.zoomStepButton,
              pressed && styles.pressed,
              displayZoom >= 3.5 && styles.disabled,
            ]}>
            <AppIcon color={colors.text} name="plus" size={18} />
          </Pressable>
        </View>
      </View>

      {/* Loading Overlay */}
      {processing && (
        <View style={styles.loadingOverlay}>
          <View
            style={[
              styles.loadingBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.lg,
              },
            ]}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={[typography.bodyStrong, styles.loadingText, {color: colors.text}]}>
              Processing puzzle artwork…
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingBottom: spacing.xs,
  },
  headerButton: {
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 60,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 9,
    letterSpacing: 1.1,
    marginTop: 2,
  },
  applyButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
    minWidth: 68,
    paddingHorizontal: spacing.md,
  },
  applyText: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  viewfinderContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  cropWindow: {
    alignItems: 'center',
    borderWidth: 1.5,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  cropImage: {
    position: 'absolute',
  },
  gridH: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  gridV: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: 1,
  },
  corner: {
    height: 16,
    position: 'absolute',
    width: 16,
  },
  cornerTL: {
    borderLeftWidth: 3,
    borderTopWidth: 3,
    left: 0,
    top: 0,
  },
  cornerTR: {
    borderRightWidth: 3,
    borderTopWidth: 3,
    right: 0,
    top: 0,
  },
  cornerBL: {
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    bottom: 0,
    left: 0,
  },
  cornerBR: {
    borderBottomWidth: 3,
    borderRightWidth: 3,
    bottom: 0,
    right: 0,
  },
  noImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBadge: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  zoomText: {
    fontSize: 11,
    fontWeight: '700',
  },
  errorText: {
    marginVertical: spacing.xs,
    textAlign: 'center',
  },
  controlsBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  toolButton: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  toolLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  zoomButtonGroup: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
  },
  zoomStepButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 48,
  },
  zoomDivider: {
    height: 24,
    width: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(5, 8, 16, 0.7)',
    justifyContent: 'center',
  },
  loadingBox: {
    alignItems: 'center',
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  loadingText: {
    fontSize: 14,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
});
