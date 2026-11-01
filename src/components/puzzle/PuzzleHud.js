import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {AppIcon} from '../AppIcon';
import {spacing} from '../../constants/theme';
import {useTheme} from '../../theme/ThemeProvider';

const DIFFICULTIES = [
  {id: 'easy', label: 'Easy 3×3', gridText: '3×3'},
  {id: 'medium', label: 'Med 4×4', gridText: '4×4'},
  {id: 'hard', label: 'Hard 5×5', gridText: '5×5'},
];

function formatElapsed(seconds = 0) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

export function PuzzleHud({
  difficulty,
  moveCount = 0,
  elapsedSeconds = 0,
  onSelectDifficulty,
  onShuffle,
  onPreview,
  disabled,
}) {
  const {colors, typography, radius} = useTheme();
  const currentDiff = DIFFICULTIES.find(d => d.id === difficulty) || DIFFICULTIES[0];

  return (
    <View style={styles.container}>
      {/* Game Status Card */}
      <View
        style={[
          styles.statusCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.md,
          },
        ]}>
        <View style={styles.statColumn}>
          <View style={styles.statHeaderRow}>
            <AppIcon color={colors.accent} name="cursor-default-click-outline" size={13} />
            <Text style={[typography.cardHeading, styles.statLabel, {color: colors.textSoft}]}>
              MOVES
            </Text>
          </View>
          <Text style={[typography.statValue, styles.statNumber, {color: colors.text}]}>
            {moveCount}
          </Text>
        </View>

        <View style={[styles.statDivider, {backgroundColor: colors.border}]} />

        <View style={styles.statColumn}>
          <View style={styles.statHeaderRow}>
            <AppIcon color={colors.accent} name="timer-outline" size={13} />
            <Text style={[typography.cardHeading, styles.statLabel, {color: colors.textSoft}]}>
              TIME
            </Text>
          </View>
          <Text style={[typography.statValue, styles.statNumber, {color: colors.text}]}>
            {formatElapsed(elapsedSeconds)}
          </Text>
        </View>

        <View style={[styles.statDivider, {backgroundColor: colors.border}]} />

        <View style={styles.statColumn}>
          <View style={styles.statHeaderRow}>
            <AppIcon color={colors.accent} name="grid" size={13} />
            <Text style={[typography.cardHeading, styles.statLabel, {color: colors.textSoft}]}>
              GRID
            </Text>
          </View>
          <Text style={[typography.statValue, styles.statNumber, {color: colors.text}]}>
            {currentDiff.gridText}
          </Text>
        </View>
      </View>

      {/* Segmented Difficulty Selector & Utility Buttons */}
      <View style={styles.controlsRow}>
        <View
          style={[
            styles.segmentedContainer,
            {
              backgroundColor: colors.surfaceDeep,
              borderColor: colors.border,
              borderRadius: radius.pill,
            },
          ]}>
          {DIFFICULTIES.map(item => {
            const active = item.id === difficulty;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{selected: active, disabled}}
                disabled={disabled}
                onPress={() => onSelectDifficulty(item.id)}
                style={({pressed}) => [
                  styles.segmentButton,
                  {
                    backgroundColor: active ? colors.accent : 'transparent',
                    borderRadius: radius.pill,
                  },
                  pressed && !active && styles.segmentPressed,
                  disabled && styles.dimmed,
                ]}>
                <Text
                  style={[
                    typography.caption,
                    styles.segmentText,
                    {
                      color: active ? colors.accentText : colors.textSoft,
                    },
                    active && styles.segmentTextActive,
                  ]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Shuffle Utility Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Shuffle puzzle"
          accessibilityHint="Scrambles the puzzle tiles"
          disabled={disabled}
          onPress={onShuffle}
          style={({pressed}) => [
            styles.utilityButton,
            {
              backgroundColor: colors.surfaceRaised,
              borderColor: colors.border,
              borderRadius: radius.md,
            },
            pressed && styles.utilityPressed,
            disabled && styles.dimmed,
          ]}>
          <AppIcon color={colors.accent} name="shuffle-variant" size={20} />
        </Pressable>

        {/* Reference Image Preview Button */}
        {onPreview ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Preview reference image"
            accessibilityHint="Shows the complete reference artwork"
            disabled={disabled}
            onPress={onPreview}
            style={({pressed}) => [
              styles.utilityButton,
              {
                backgroundColor: colors.surfaceRaised,
                borderColor: colors.border,
                borderRadius: radius.md,
              },
              pressed && styles.utilityPressed,
              disabled && styles.dimmed,
            ]}>
            <AppIcon color={colors.accent} name="eye-outline" size={20} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    marginBottom: spacing.md,
    width: '100%',
  },
  statusCard: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
  },
  statNumber: {
    fontSize: 20,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  statDivider: {
    height: 28,
    width: StyleSheet.hairlineWidth,
  },
  controlsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  segmentedContainer: {
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    height: 40,
    padding: 3,
  },
  segmentButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  segmentPressed: {
    opacity: 0.7,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  segmentTextActive: {
    fontWeight: '800',
  },
  utilityButton: {
    alignItems: 'center',
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  utilityPressed: {
    opacity: 0.75,
  },
  dimmed: {
    opacity: 0.45,
  },
});
