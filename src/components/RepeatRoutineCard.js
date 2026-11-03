import React, {useCallback} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';
import {
  formatRepeatSummary,
  normalizeRepeatDays,
  WEEKDAY_CONFIG,
} from '../utils/repeatDays';
import {SurfaceCard} from './SurfaceCard';

export function RepeatRoutineCard({
  selectedDays = [],
  onChange,
  disabled = false,
}) {
  const {colors, typography, radius} = useTheme();
  const normalized = normalizeRepeatDays(selectedDays);
  const summaryText = formatRepeatSummary(normalized);

  const toggleDay = useCallback(
    dayId => {
      if (disabled || !onChange) {
        return;
      }
      const isSelected = normalized.includes(dayId);
      let nextDays;
      if (isSelected) {
        nextDays = normalized.filter(d => d !== dayId);
      } else {
        nextDays = [...normalized, dayId];
      }
      onChange(normalizeRepeatDays(nextDays));
    },
    [disabled, normalized, onChange],
  );

  return (
    <SurfaceCard style={[styles.card, {borderRadius: radius.lg}]}>
      <View style={styles.header}>
        <Text style={[typography.sectionLabel, styles.sectionTitle, {color: colors.muted}]}>
          REPEAT ROUTINE
        </Text>
        <Text
          accessibilityLiveRegion="polite"
          style={[typography.caption, styles.summary, {color: colors.accent}]}>
          {summaryText}
        </Text>
      </View>

      <View style={styles.chipsRow}>
        {WEEKDAY_CONFIG.map(item => {
          const isSelected = normalized.includes(item.id);
          return (
            <Pressable
              key={item.id}
              accessibilityLabel={`${item.fullName}, ${isSelected ? 'selected' : 'not selected'}`}
              accessibilityRole="button"
              accessibilityState={{checked: isSelected, disabled}}
              disabled={disabled}
              onPress={() => toggleDay(item.id)}
              style={({pressed}) => [
                styles.dayChip,
                {
                  backgroundColor: isSelected ? colors.accent : colors.surfaceDeep,
                  borderColor: isSelected ? colors.accent : colors.border,
                  borderRadius: radius.md,
                  opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
                },
              ]}>
              <Text
                style={[
                  typography.bodyStrong,
                  styles.dayText,
                  {color: isSelected ? colors.accentText : colors.muted},
                ]}>
                {item.label}
              </Text>
              <View
                style={[
                  styles.chipDot,
                  isSelected
                    ? {backgroundColor: colors.accentText}
                    : styles.dotInactive,
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      <Text style={[typography.caption, styles.note, {color: colors.textSoft}]}>
        {normalized.length === 0
          ? 'Rings once. Select weekdays to repeat every week automatically.'
          : 'Repeats weekly. Must solve vision puzzle each time to dismiss.'}
      </Text>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  summary: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  dayChip: {
    alignItems: 'center',
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: '12.8%',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
  },
  chipDot: {
    borderRadius: 2,
    height: 4,
    marginTop: 3,
    width: 4,
  },
  dotInactive: {
    backgroundColor: 'transparent',
  },
  note: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.sm,
  },
});
