import {Pressable, StyleSheet, Text} from 'react-native';
import {colors, spacing} from '../constants/theme';

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  tone = 'accent',
}) {
  const toneStyle = tone === 'danger' ? styles.danger : styles.accent;
  const textStyle = tone === 'danger' ? styles.dangerText : styles.accentText;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        toneStyle,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Text style={[styles.label, textStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  accent: {
    backgroundColor: colors.accent,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  accentText: {
    color: colors.accentText,
  },
  dangerText: {
    color: colors.text,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.82,
  },
});
