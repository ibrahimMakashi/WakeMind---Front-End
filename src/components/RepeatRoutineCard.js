import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';
import {SurfaceCard} from './SurfaceCard';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function RepeatRoutineCard() {
  const {colors, typography, radius} = useTheme();

  return (
    <SurfaceCard style={[styles.card, {borderRadius: radius.lg}]}>
      <View style={styles.header}>
        <Text style={[typography.sectionLabel, styles.sectionTitle, {color: colors.muted}]}>
          REPEAT ROUTINE
        </Text>
        <Text style={[typography.caption, styles.summary, {color: colors.accent}]}>
          Once
        </Text>
      </View>

      <View style={styles.chipsRow}>
        {WEEKDAYS.map((day, idx) => (
          <View
            key={`day-chip-${idx}`}
            style={[
              styles.dayChip,
              {
                backgroundColor: colors.surfaceDeep,
                borderColor: colors.border,
                borderRadius: radius.md,
              },
            ]}>
            <Text style={[typography.bodyStrong, styles.dayText, {color: colors.muted}]}>
              {day}
            </Text>
            <View style={[styles.chipDot, {backgroundColor: colors.border}]} />
          </View>
        ))}
      </View>

      <Text style={[typography.caption, styles.note, {color: colors.textSoft}]}>
        One-time alarm. Recurring routine alarms are scheduled for a future milestone.
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
    opacity: 0.6,
    width: '12.5%',
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
  note: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.sm,
  },
});
