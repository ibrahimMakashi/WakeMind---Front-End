import {Pressable, StyleSheet, Switch, Text, View} from 'react-native';
import {colors, spacing} from '../constants/theme';
import {difficultyLabel, formatClock, repeatLabel} from '../utils/time';

export function AlarmCard({alarm, onToggle, onEdit, onDelete, disabled}) {
  const clock = formatClock(alarm.hour, alarm.minute);
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.timeBlock}>
          <Text style={styles.time}>
            {clock.hourText}:{clock.minuteText}
          </Text>
          <Text style={styles.period}>{clock.period}</Text>
        </View>
        <Switch
          accessibilityLabel={
            alarm.enabled ? 'Turn alarm off' : 'Turn alarm on'
          }
          disabled={disabled}
          value={alarm.enabled}
          onValueChange={onToggle}
          trackColor={{false: colors.line, true: colors.success}}
          thumbColor={colors.text}
        />
      </View>
      <Text style={styles.meta}>
        {repeatLabel(alarm.repeat)} · {difficultyLabel(alarm.difficulty)}
      </Text>
      <Text style={styles.meta}>
        {alarm.label} · Sound · {alarm.vibrate ? 'Vibrate' : 'Silent'}
      </Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={onEdit}
          style={styles.action}>
          <Text style={styles.actionText}>Edit</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={onDelete}
          style={styles.action}>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeBlock: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  time: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
  },
  period: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: spacing.sm,
  },
  meta: {
    color: colors.muted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  action: {
    marginRight: spacing.lg,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  deleteText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
});
