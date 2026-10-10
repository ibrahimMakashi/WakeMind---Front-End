import {Pressable, StyleSheet, Text} from 'react-native';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  tone = 'accent',
}) {
  const {colors} = useTheme();
  const backgroundColor = tone === 'danger' ? colors.danger : colors.accent;
  const textColor = tone === 'danger' ? colors.text : colors.accentText;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        {backgroundColor},
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Text style={[styles.label, {color: textColor}]}>{label}</Text>
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
