import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {spacing} from '../../constants/theme';
import {useTheme} from '../../theme/ThemeProvider';
import {AppIcon} from '../AppIcon';
import {SurfaceCard} from '../SurfaceCard';

const DIFFICULTY_CONFIG = [
  {
    id: 'easy',
    grid: '3 × 3',
    label: 'NORMAL',
    tiles: 9,
    summary: '9 Tiles (Normal)',
  },
  {
    id: 'medium',
    grid: '4 × 4',
    label: 'CHALLENGING',
    tiles: 16,
    summary: '16 Tiles (Challenging)',
  },
  {
    id: 'hard',
    grid: '5 × 5',
    label: 'HARDCORE',
    tiles: 25,
    summary: '25 Tiles (Hardcore)',
  },
];

function GridOverlay({difficulty}) {
  const count = difficulty === 'hard' ? 5 : difficulty === 'medium' ? 4 : 3;
  const lines = Array.from({length: count - 1}, (_, i) => ((i + 1) / count) * 100);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {lines.map((pos, idx) => (
        <View
          key={`v-${idx}`}
          style={[styles.gridLineV, {left: `${pos}%`}]}
        />
      ))}
      {lines.map((pos, idx) => (
        <View
          key={`h-${idx}`}
          style={[styles.gridLineH, {top: `${pos}%`}]}
        />
      ))}
      <View style={styles.centerBadgeWrap}>
        <View style={styles.puzzleActiveBadge}>
          <Text style={styles.puzzleActiveText}>Puzzle Active</Text>
        </View>
      </View>
    </View>
  );
}

export function WakeUpVisionMissionCard({
  currentImage,
  difficulty = 'easy',
  onDifficultyChange,
  onReplacePress,
  disabled = false,
}) {
  const {colors, typography, radius} = useTheme();
  const currentDiff = DIFFICULTY_CONFIG.find(d => d.id === difficulty) || DIFFICULTY_CONFIG[0];

  return (
    <SurfaceCard style={[styles.card, {borderRadius: radius.lg}]}>
      {/* 7.1 Card Heading */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconTile,
              {backgroundColor: colors.surfaceDeep, borderRadius: radius.icon},
            ]}>
            <AppIcon color={colors.accent} name="view-grid-outline" size={20} />
          </View>
          <View style={styles.headerTitles}>
            <View style={styles.titleWithBadge}>
              <Text style={[typography.bodyStrong, styles.title, {color: colors.text}]}>
                Wake-Up Vision Mission
              </Text>
              <View style={[styles.lockBadge, {borderColor: colors.accent}]}>
                <Text style={[typography.caption, styles.lockBadgeText, {color: colors.accent}]}>
                  LOCK ACTIVE
                </Text>
              </View>
            </View>
            <Text style={[typography.caption, styles.subtitle, {color: colors.textSoft}]}>
              Solve your vision board puzzle to turn off alarm
            </Text>
          </View>
        </View>
      </View>

      {/* 7.2 Large Selected-Image Preview with Grid Overlay */}
      <View
        style={[
          styles.previewContainer,
          {
            backgroundColor: colors.surfaceDeep,
            borderColor: colors.border,
            borderRadius: radius.md,
          },
        ]}>
        {currentImage?.source ? (
          <Image
            fadeDuration={0}
            resizeMode="cover"
            source={currentImage.source}
            style={styles.previewImage}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <AppIcon color={colors.muted} name="image-outline" size={48} />
          </View>
        )}

        {/* Dynamic Grid Overlay */}
        <GridOverlay difficulty={difficulty} />

        {/* 7.3 Bottom Image Information Bar */}
        <View style={styles.infoBar}>
          <View style={styles.infoBarLeft}>
            <AppIcon color={colors.accent} name="image-outline" size={16} />
            <Text numberOfLines={1} style={[typography.caption, styles.imageName, {color: colors.text}]}>
              {currentImage?.title || 'physique_goal_2025.jpg'}
            </Text>
          </View>

          <Pressable
            accessibilityHint="Opens artwork gallery to choose or crop a different picture"
            accessibilityLabel={`Replace current image ${currentImage?.title || ''}`}
            accessibilityRole="button"
            disabled={disabled}
            onPress={onReplacePress}
            style={({pressed}) => [
              styles.replaceButton,
              {
                backgroundColor: 'rgba(11, 16, 32, 0.75)',
                borderColor: colors.accent,
                borderRadius: radius.pill,
              },
              pressed && styles.pressed,
              disabled && styles.disabled,
            ]}>
            <AppIcon color={colors.accent} name="camera-outline" size={14} />
            <Text style={[typography.caption, styles.replaceText, {color: colors.accent}]}>
              Replace
            </Text>
          </Pressable>
        </View>
      </View>

      {/* PART 8: Puzzle Grid Difficulty Selection */}
      <View style={styles.difficultySection}>
        <View style={styles.diffHeader}>
          <Text style={[typography.caption, styles.diffHeading, {color: colors.muted}]}>
            Puzzle Grid Difficulty
          </Text>
          <Text style={[typography.caption, styles.diffSummary, {color: colors.accent}]}>
            {currentDiff.summary}
          </Text>
        </View>

        <View style={styles.difficultyOptionsRow}>
          {DIFFICULTY_CONFIG.map(item => {
            const isSelected = item.id === difficulty;
            return (
              <Pressable
                key={item.id}
                accessibilityLabel={`${item.grid} ${item.label} difficulty`}
                accessibilityRole="button"
                accessibilityState={{selected: isSelected}}
                disabled={disabled}
                onPress={() => onDifficultyChange?.(item.id)}
                style={({pressed}) => [
                  styles.diffCard,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.surfaceDeep,
                    borderColor: isSelected ? colors.accent : colors.border,
                    borderRadius: radius.md,
                  },
                  isSelected && styles.diffCardSelected,
                  pressed && !disabled && styles.pressed,
                ]}>
                <Text
                  style={[
                    styles.diffGridText,
                    {color: isSelected ? colors.accentText : colors.text},
                  ]}>
                  {item.grid}
                </Text>
                <Text
                  style={[
                    styles.diffLabelText,
                    {color: isSelected ? colors.accentText : colors.muted},
                  ]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    padding: spacing.md,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  iconTile: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerTitles: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  titleWithBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  lockBadge: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  lockBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  previewContainer: {
    aspectRatio: 16 / 10,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  previewImage: {
    height: '100%',
    width: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  gridLineV: {
    backgroundColor: 'rgba(255, 184, 77, 0.42)',
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: 1,
  },
  gridLineH: {
    backgroundColor: 'rgba(255, 184, 77, 0.42)',
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  centerBadgeWrap: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  puzzleActiveBadge: {
    backgroundColor: 'rgba(11, 16, 32, 0.88)',
    borderColor: 'rgba(255, 184, 77, 0.65)',
    borderRadius: 6,
    borderWidth: 1,
    elevation: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  puzzleActiveText: {
    color: '#FFB84D',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  infoBar: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 16, 32, 0.82)',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    position: 'absolute',
    right: 0,
  },
  infoBarLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    marginRight: spacing.sm,
  },
  imageName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  replaceButton: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    minHeight: 28,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  replaceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  difficultySection: {
    marginTop: spacing.md,
  },
  diffHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  diffHeading: {
    fontSize: 12,
    fontWeight: '600',
  },
  diffSummary: {
    fontSize: 12,
    fontWeight: '700',
  },
  difficultyOptionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  diffCard: {
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 60,
    paddingVertical: spacing.sm,
  },
  diffCardSelected: {
    elevation: 3,
  },
  diffGridText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  diffLabelText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.5,
  },
});
