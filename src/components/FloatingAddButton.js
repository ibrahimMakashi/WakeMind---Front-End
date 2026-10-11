import {Pressable, StyleSheet, View} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';
import {AppIcon} from './AppIcon';

export function FloatingAddButton({onPress, disabled}) {
  const {colors, radius} = useTheme();
  // The screen scene ends at the top edge of the tab bar.
  const bottom = 0;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, {bottom}]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add alarm"
        accessibilityState={{disabled}}
        disabled={disabled}
        onPress={onPress}
        style={({pressed}) => [
          styles.button,
          {
            backgroundColor: colors.accent,
            borderRadius: radius.fab,
            shadowColor: colors.accent,
          },
          pressed && !disabled && styles.pressed,
          disabled && styles.dimmed,
        ]}>
        <AppIcon name="plus" color={colors.accentText} size={28} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 10,
  },
  button: {
    alignItems: 'center',
    elevation: 8,
    height: 56,
    justifyContent: 'center',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    width: 56,
  },
  pressed: {
    opacity: 0.9,
    transform: [{scale: 0.97}],
  },
  dimmed: {
    opacity: 0.45,
  },
});
