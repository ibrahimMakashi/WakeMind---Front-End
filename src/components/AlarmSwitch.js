import {StyleSheet, Switch, View} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';

export function AlarmSwitch({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
}) {
  const {colors} = useTheme();

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="switch"
      accessibilityState={{checked: value, disabled}}
      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
      onResponderRelease={() => {
        if (!disabled && onValueChange) {
          onValueChange(!value);
        }
      }}
      onStartShouldSetResponder={() => !disabled}
      style={[
        styles.track,
        {
          backgroundColor: value
            ? colors.accent
            : colors.switchOff || '#1F2839',
          shadowColor: value ? colors.accent : 'transparent',
        },
        value && styles.trackGlow,
        disabled && styles.disabled,
      ]}>
      <View
        style={[
          styles.thumb,
          value
            ? [
                styles.thumbOn,
                {
                  backgroundColor: colors.switchThumb || '#070C16',
                },
              ]
            : [
                styles.thumbOff,
                {
                  backgroundColor: colors.switchThumbOff || '#5A6882',
                },
              ],
        ]}
      />
      {/* Hidden native switch to retain native accessibility and unit test compatibility */}
      <Switch
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        onValueChange={onValueChange}
        pointerEvents="none"
        style={styles.hiddenNativeSwitch}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    position: 'relative',
    width: 50,
  },
  trackGlow: {
    elevation: 4,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.45,
    shadowRadius: 6,
  },
  thumb: {
    borderRadius: 11,
    height: 22,
    position: 'absolute',
    top: 3,
    width: 22,
  },
  thumbOn: {
    right: 3,
  },
  thumbOff: {
    left: 3,
  },
  disabled: {
    opacity: 0.6,
  },
  hiddenNativeSwitch: {
    height: 0,
    opacity: 0,
    position: 'absolute',
    width: 0,
  },
});
