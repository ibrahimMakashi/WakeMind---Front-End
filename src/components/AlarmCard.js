import {Pressable, StyleSheet, Switch, Text, View} from 'react-native';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';
import {difficultyLabel, formatClock, repeatLabel} from '../utils/time';

export function AlarmCard({alarm, onToggle, onEdit, onDelete, disabled}) {
  const {colors} = useTheme();
  const clock = formatClock(alarm.hour, alarm.minute);
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
          <Text style={[styles.period, {color: colors.muted}]}>
            {clock.period}
          </Text>
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
      <Text style={[styles.meta, {color: colors.muted}]}>
        {repeatLabel(alarm.repeat)} · {difficultyLabel(alarm.difficulty)}
      </Text>
      <Text style={[styles.meta, {color: colors.muted}]}>
        {alarm.label} · Sound · {alarm.vibrate ? 'Vibrate' : 'Silent'}
      </Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={onEdit}
          style={styles.action}>
          <Text style={[styles.actionText, {color: colors.accent}]}>Edit</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={onDelete}
          style={styles.action}>
          <Text style={[styles.actionText, {color: colors.danger}]}>
            Delete
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
  },
  period: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: spacing.sm,
  },
  meta: {
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
    fontSize: 15,
    fontWeight: '700',
  },
});
