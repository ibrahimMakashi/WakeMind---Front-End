import {useRef} from 'react';
import {Animated, Pressable, StyleSheet, Text} from 'react-native';
import {spacing} from '../constants/theme';
import {motionDuration} from '../theme/motion';
import {useTheme} from '../theme/ThemeProvider';
import {usePrefersReducedMotion} from '../theme/usePrefersReducedMotion';

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  tone = 'accent',
}) {
  const {colors} = useTheme();
  const reducedMotion = usePrefersReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;
  const backgroundColor = tone === 'danger' ? colors.danger : colors.accent;
  const textColor = tone === 'danger' ? colors.onDanger : colors.accentText;

  function animateTo(value) {
    Animated.timing(opacity, {
      toValue: value,
      duration: motionDuration(reducedMotion, 180),
      useNativeDriver: true,
    }).start();
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        if (!disabled) {
          animateTo(0.82);
        }
      }}
      onPressOut={() => animateTo(1)}>
      <Animated.View
        style={[
          styles.button,
          {backgroundColor, opacity},
          disabled && styles.disabled,
        ]}>
        <Text style={[styles.label, {color: textColor}]}>{label}</Text>
      </Animated.View>
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
});
