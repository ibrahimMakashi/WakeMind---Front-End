import {Pressable, StyleSheet, Switch, Text, View} from 'react-native';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';
import {formatAlarmListTime} from '../utils/time';

export function AlarmCard({alarm, onToggle, onEdit, disabled}) {
  const {colors} = useTheme();
  const timeLabel = formatAlarmListTime(alarm.hour, alarm.minute);
  const timeColor = alarm.enabled ? colors.text : colors.muted;
  const labelColor = alarm.enabled ? colors.textSoft : colors.muted;
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${alarm.label}, ${timeLabel}`}
        disabled={disabled}
        onPress={onEdit}
        style={styles.copy}>
        <Text style={[styles.time, {color: timeColor}]}>{timeLabel}</Text>
        <Text style={[styles.label, {color: labelColor}]}>{alarm.label}</Text>
      </Pressable>
      <View style={styles.switchHit}>
        <Switch
          accessibilityLabel={
            alarm.enabled ? `Turn ${alarm.label} off` : `Turn ${alarm.label} on`
          }
          disabled={disabled}
          value={alarm.enabled}
          onValueChange={onToggle}
          trackColor={{false: colors.switchOff, true: colors.success}}
          thumbColor={colors.switchThumb}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 96,
    paddingVertical: spacing.sm,
  },
  copy: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingRight: spacing.md,
  },
  time: {
    fontSize: 42,
    fontWeight: '400',
    letterSpacing: -0.8,
  },
  label: {
    fontSize: 15,
    marginTop: 2,
  },
  switchHit: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 52,
  },
});
