import React from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppIcon} from '../AppIcon';
import {GRID_SIZES} from '../../puzzle/constants';
import {spacing} from '../../constants/theme';
import {useTheme} from '../../theme/ThemeProvider';

function getDifficultyConfig(difficulty) {
  const norm = (difficulty || 'easy').toLowerCase();
  const side = GRID_SIZES[norm] || 3;
  const tiles = side * side;

  switch (norm) {
    case 'hard':
      return {
        side,
        tiles,
        label: 'HARDCORE',
        summary: 'Peak Alertness',
      };
    case 'medium':
      return {
        side,
        tiles,
        label: 'CHALLENGING',
        summary: 'Deep Focus',
      };
    case 'easy':
    default:
      return {
        side,
        tiles,
        label: 'NORMAL',
        summary: 'Standard Awakening',
      };
  }
}

export function PuzzlePreviewModal({
  visible,
  onClose,
  imageSource,
  difficulty = 'easy',
  title = 'Puzzle Grid Preview',
}) {
  const insets = useSafeAreaInsets();
  const {colors, typography, radius} = useTheme();
  const {width, height} = useWindowDimensions();

  const config = getDifficultyConfig(difficulty);
  const side = config.side;
  const lines = Array.from({length: side - 1}, (_, i) => ((i + 1) / side) * 100);

  // Large preview sizing maintaining a crisp square
  const previewSize = Math.floor(Math.min(width - spacing.lg * 2, height * 0.52, 420));

  return (
    <Modal
      animationType="fade"
      hardwareAccelerated
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <View style={[styles.backdrop, {backgroundColor: 'rgba(5, 8, 16, 0.92)'}]}>
        <View
          style={[
            styles.container,
            {
              paddingTop: insets.top + spacing.md,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View>
              <Text style={[typography.screenTitle, styles.title, {color: colors.text}]}>
                {title}
              </Text>
              <Text style={[typography.caption, styles.subtitle, {color: colors.textSoft}]}>
                Exact {side} × {side} grid layout for wake-up dismissal
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close enlarged preview"
              accessibilityRole="button"
              onPress={onClose}
              style={({pressed}) => [
                styles.closeButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.pill,
                },
                pressed && styles.pressed,
              ]}>
              <AppIcon color={colors.text} name="close" size={20} />
            </Pressable>
          </View>

          {/* Large Grid Preview */}
          <View style={styles.previewWrapper}>
            <View
              style={[
                styles.previewBox,
                {
                  width: previewSize,
                  height: previewSize,
                  borderRadius: radius.lg,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceDeep,
                },
              ]}>
              {imageSource ? (
                <Image
                  fadeDuration={0}
                  resizeMode="cover"
                  source={imageSource}
                  style={styles.image}
                />
              ) : (
                <View style={styles.placeholder}>
                  <AppIcon color={colors.muted} name="image-outline" size={64} />
                </View>
              )}

              {/* Grid Lines */}
              <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                {lines.map((pos, idx) => (
                  <View
                    key={`v-${idx}`}
                    style={[
                      styles.gridLineV,
                      {
                        left: `${pos}%`,
                        backgroundColor: 'rgba(255, 184, 77, 0.45)',
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
                        backgroundColor: 'rgba(255, 184, 77, 0.45)',
                      },
                    ]}
                  />
                ))}
              </View>

              {/* Watermark Badge */}
              <View style={styles.centerBadgeWrap} pointerEvents="none">
                <View
                  style={[
                    styles.centerBadge,
                    {
                      backgroundColor: 'rgba(11, 16, 32, 0.85)',
                      borderColor: colors.accent,
                    },
                  ]}>
                  <AppIcon color={colors.accent} name="eye-outline" size={14} />
                  <Text style={[typography.caption, styles.centerBadgeText, {color: colors.accent}]}>
                    {side}×{side} Preview Mode
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Stats & Difficulty Info Card */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
              },
            ]}>
            <View style={styles.infoCol}>
              <Text style={[typography.caption, styles.infoLabel, {color: colors.muted}]}>
                GRID DIFFICULTY
              </Text>
              <Text style={[typography.bodyStrong, styles.infoValue, {color: colors.accent}]}>
                {side} × {side} {config.label}
              </Text>
            </View>
            <View style={[styles.infoDivider, {backgroundColor: colors.border}]} />
            <View style={styles.infoCol}>
              <Text style={[typography.caption, styles.infoLabel, {color: colors.muted}]}>
                PUZZLE TILES
              </Text>
              <Text style={[typography.bodyStrong, styles.infoValue, {color: colors.text}]}>
                {config.tiles} Pieces
              </Text>
            </View>
            <View style={[styles.infoDivider, {backgroundColor: colors.border}]} />
            <View style={styles.infoCol}>
              <Text style={[typography.caption, styles.infoLabel, {color: colors.muted}]}>
                CHALLENGE
              </Text>
              <Text style={[typography.bodyStrong, styles.infoValue, {color: colors.textSoft}]}>
                {config.summary}
              </Text>
            </View>
          </View>

          {/* Bottom Done Button */}
          <Pressable
            accessibilityLabel="Done inspecting preview"
            accessibilityRole="button"
            onPress={onClose}
            style={({pressed}) => [
              styles.doneButton,
              {
                backgroundColor: colors.accent,
                borderRadius: radius.md,
              },
              pressed && styles.pressed,
            ]}>
            <Text style={[typography.button, styles.doneText, {color: colors.accentText}]}>
              Done Previewing
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    alignItems: 'center',
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  previewWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  previewBox: {
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
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
    width: 1.5,
  },
  gridLineH: {
    height: 1.5,
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
    letterSpacing: 0.5,
  },
  infoCard: {
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
  },
  infoCol: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoDivider: {
    width: 1,
    height: '100%',
  },
  doneButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: spacing.sm,
  },
  doneText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
});
