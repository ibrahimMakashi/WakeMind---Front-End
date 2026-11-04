import React, {useState} from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {AppIcon} from '../AppIcon';
import {GRID_SIZES} from '../../puzzle/constants';
import {spacing} from '../../constants/theme';
import {useTheme} from '../../theme/ThemeProvider';
import {PuzzlePreviewModal} from './PuzzlePreviewModal';

export function getDifficultyMeta(difficulty) {
  const norm = (difficulty || 'easy').toLowerCase();
  const side = GRID_SIZES[norm] || 3;
  const tiles = side * side;

  switch (norm) {
    case 'hard':
      return {
        side,
        tiles,
        label: 'HARDCORE',
        description: '5 × 5 grid • 25 tiles • Peak alertness',
      };
    case 'medium':
      return {
        side,
        tiles,
        label: 'CHALLENGING',
        description: '4 × 4 grid • 16 tiles • Deep focus',
      };
    case 'easy':
    default:
      return {
        side,
        tiles,
        label: 'NORMAL',
        description: '3 × 3 grid • 9 tiles • Standard wake-up',
      };
  }
}

export function PuzzlePreview({
  imageSource,
  imageUri,
  imageTitle,
  difficulty = 'easy',
  gridSize,
  onPress,
  onEditImage,
  onChangeImage,
  disabled = false,
  style,
}) {
  const {colors, typography, radius} = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const resolvedSource = imageSource || (imageUri ? {uri: imageUri} : null);
  const meta = getDifficultyMeta(difficulty);
  const side = gridSize || meta.side;
  const lines = Array.from({length: side - 1}, (_, i) => ((i + 1) / side) * 100);

  const handlePreviewPress = () => {
    if (disabled) {
      return;
    }
    if (onPress) {
      onPress();
    } else {
      setModalVisible(true);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Interactive Grid Card */}
      <Pressable
        accessibilityHint="Opens enlarged full-screen grid view"
        accessibilityLabel={`Puzzle preview ${side} by ${side} grid, ${meta.tiles} tiles. Tap to enlarge.`}
        accessibilityRole="button"
        disabled={disabled}
        onPress={handlePreviewPress}
        style={({pressed}) => [
          styles.previewFrame,
          {
            backgroundColor: colors.surfaceDeep,
            borderColor: colors.border,
            borderRadius: radius.md,
          },
          pressed && !disabled && styles.pressed,
        ]}>
        {resolvedSource ? (
          <Image
            fadeDuration={0}
            resizeMode="cover"
            source={resolvedSource}
            style={styles.image}
          />
        ) : (
          <View style={styles.placeholder}>
            <AppIcon color={colors.muted} name="image-outline" size={48} />
          </View>
        )}

        {/* Dynamic Grid Overlay */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {lines.map((pos, idx) => (
            <View
              key={`v-${idx}`}
              style={[
                styles.gridLineV,
                {
                  left: `${pos}%`,
                  backgroundColor: 'rgba(255, 184, 77, 0.4)',
                },
              ]}
            />
          ))}
          {lines.map((pos, idx) => (
            <View
              key={`h-${idx}`}
              style={[
                styles.gridLineH,
                {
                  top: `${pos}%`,
                  backgroundColor: 'rgba(255, 184, 77, 0.4)',
                },
              ]}
            />
          ))}
        </View>

        {/* Center Badge with Enlarge Indicator */}
        <View style={styles.centerBadgeWrap} pointerEvents="none">
          <View
            style={[
              styles.centerBadge,
              {
                backgroundColor: 'rgba(11, 16, 32, 0.85)',
                borderColor: colors.accent,
              },
            ]}>
            <AppIcon color={colors.accent} name="arrow-expand" size={13} />
            <Text style={[typography.caption, styles.centerBadgeText, {color: colors.accent}]}>
              {side}×{side} Preview • Tap to Enlarge
            </Text>
          </View>
        </View>

        {/* Bottom Floating Info & Action Strip */}
        <View style={styles.bottomBar}>
          <View style={styles.imageInfo}>
            <AppIcon color={colors.accent} name="image-outline" size={15} />
            <Text
              numberOfLines={1}
              style={[typography.caption, styles.imageName, {color: colors.text}]}>
              {imageTitle || 'Selected Artwork'}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            {onEditImage && (
              <Pressable
                accessibilityHint="Opens image editor to crop and zoom"
                accessibilityLabel="Edit or crop current puzzle image"
                accessibilityRole="button"
                disabled={disabled}
                onPress={onEditImage}
                style={({pressed}) => [
                  styles.pillButton,
                  {
                    backgroundColor: 'rgba(11, 16, 32, 0.85)',
                    borderColor: colors.accent,
                    borderRadius: radius.pill,
                  },
                  pressed && styles.pressed,
                ]}>
                <AppIcon color={colors.accent} name="crop" size={13} />
                <Text style={[typography.caption, styles.pillText, {color: colors.accent}]}>
                  Edit
                </Text>
              </Pressable>
            )}

            {onChangeImage && (
              <Pressable
                accessibilityHint="Opens artwork gallery to choose a different photo"
                accessibilityLabel="Change puzzle image"
                accessibilityRole="button"
                disabled={disabled}
                onPress={onChangeImage}
                style={({pressed}) => [
                  styles.pillButton,
                  {
                    backgroundColor: 'rgba(11, 16, 32, 0.85)',
                    borderColor: colors.accent,
                    borderRadius: radius.pill,
                  },
                  pressed && styles.pressed,
                ]}>
                <AppIcon color={colors.accent} name="camera-outline" size={13} />
                <Text style={[typography.caption, styles.pillText, {color: colors.accent}]}>
                  Change
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>

      {/* Description Line */}
      <View style={styles.footer}>
        <Text style={[typography.caption, styles.footerText, {color: colors.textSoft}]}>
          {meta.description}
        </Text>
      </View>

      {/* Full-view Modal */}
      <PuzzlePreviewModal
        difficulty={difficulty}
        imageSource={resolvedSource}
        onClose={() => setModalVisible(false)}
        title="Wake-Up Puzzle Grid"
        visible={modalVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  previewFrame: {
    aspectRatio: 1,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  placeholder: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  gridLineV: {
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: 1,
  },
  gridLineH: {
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  centerBadgeWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBadge: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  centerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bottomBar: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 16, 32, 0.78)',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: 'absolute',
    right: 0,
  },
  imageInfo: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    marginRight: spacing.xs,
  },
  imageName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pillButton: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    marginTop: 6,
    paddingHorizontal: 2,
  },
  footerText: {
    fontSize: 11,
  },
  pressed: {
    opacity: 0.88,
  },
});
