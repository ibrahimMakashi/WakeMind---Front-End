import {Pressable, StyleSheet, View} from 'react-native';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';
import {AppIcon} from './AppIcon';

export const FAB_SIZE = 56;
// The alarms scene ends at the tab bar. The reference leaves a gap above it.
export const FAB_BOTTOM_GAP = spacing.md;

export function FloatingAddButton({onPress, disabled}) {
  const {colors, radius} = useTheme();
  const bottom = FAB_BOTTOM_GAP;

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
    height: FAB_SIZE,
    justifyContent: 'center',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    width: FAB_SIZE,
  },
  pressed: {
    opacity: 0.9,
    transform: [{scale: 0.97}],
  },
  dimmed: {
    opacity: 0.45,
  },
});
