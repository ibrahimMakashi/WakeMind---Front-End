import {StyleSheet, View} from 'react-native';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';

// The card keeps identical style keys in every state (same border widths, same
// overflow). Only colors change, so the native view is never re-flattened and
// its children cannot be dropped when an alarm is toggled.
export function SurfaceCard({children, style, accentTop = false, subdued = false}) {
  const {colors, radius} = useTheme();
  return (
    <View
      collapsable={false}
      style={[
        styles.card,
        {
          backgroundColor: subdued ? colors.surface : colors.surfaceRaised,
          borderColor: colors.border,
          borderRadius: radius.md,
          borderTopColor: accentTop ? colors.accent : colors.border,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 2,
    padding: spacing.md,
  },
});
