import {Pressable, StyleSheet, Switch, Text, View} from 'react-native';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';
import {difficultyLabel, formatClock, repeatLabel} from '../utils/time';
import {AppIcon} from './AppIcon';

export function AlarmCard({alarm, onToggle, onEdit, onDelete, disabled}) {
  const {colors} = useTheme();
  const clock = formatClock(alarm.hour, alarm.minute);
  const details = [
    alarm.label,
    repeatLabel(alarm.repeat),
    difficultyLabel(alarm.difficulty),
    'Sound',
    alarm.vibrate ? 'Vibrate' : 'Silent',
  ].join(' · ');
  return (
    <View
      style={[
        styles.card,
        {backgroundColor: colors.surface, borderColor: colors.line},
      ]}>
      <View style={styles.topRow}>
        <View style={styles.timeBlock}>
          <Text style={[styles.time, {color: colors.text}]}>
            {clock.hourText}:{clock.minuteText}
          </Text>
          <Text style={[styles.period, {color: colors.muted}]}>{clock.period}</Text>
        </View>
        <View style={styles.switchHit}>
          <Switch
            accessibilityLabel={
              alarm.enabled
                ? `Turn ${alarm.label} off`
                : `Turn ${alarm.label} on`
            }
            disabled={disabled}
            value={alarm.enabled}
            onValueChange={onToggle}
            trackColor={{false: colors.line, true: colors.success}}
            thumbColor={colors.text}
          />
        </View>
      </View>
      <View style={styles.bottomRow}>
        <Text style={[styles.meta, {color: colors.muted}]}>{details}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${alarm.label}`}
          disabled={disabled}
          onPress={onEdit}
          style={styles.iconButton}>
          <AppIcon name="pencil-outline" color={colors.accent} size={22} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${alarm.label}`}
          disabled={disabled}
          onPress={onDelete}
          style={styles.iconButton}>
          <AppIcon name="delete-outline" color={colors.danger} size={22} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  timeBlock: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexShrink: 1,
  },
  time: {
    fontSize: 32,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  period: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 5,
    marginLeft: spacing.sm,
  },
  switchHit: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 52,
  },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  meta: {
    flex: 1,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
    marginRight: spacing.xs,
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
