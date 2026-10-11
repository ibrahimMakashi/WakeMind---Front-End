import {Pressable, StyleSheet, Text} from 'react-native';
import {spacing} from '../constants/theme';
import {formatEditorTime, to24Hour} from '../utils/time';

export function AlarmTimeSelector({
  hour12,
  minute,
  period,
  colors,
  disabled,
  onPress,
}) {
  const hour24 = to24Hour(hour12, period);
  const label = formatEditorTime(hour24, minute);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Alarm time ${label}. Tap to change.`}
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.surface,
        {backgroundColor: colors.group},
        pressed && !disabled && styles.pressed,
        disabled && styles.dimmed,
      ]}>
      <Text style={[styles.caption, {color: colors.muted}]}>Time</Text>
      <Text style={[styles.time, {color: colors.text}]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  surface: {
    alignItems: 'center',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 112,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  caption: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginBottom: spacing.xs,
  },
  time: {
    fontSize: 48,
    fontVariant: ['tabular-nums'],
    fontWeight: '300',
    letterSpacing: -0.5,
  },
  pressed: {
    opacity: 0.88,
  },
  dimmed: {
    opacity: 0.45,
  },
});
