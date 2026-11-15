import {StyleSheet, View} from 'react-native';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';

// The card keeps identical style keys in every state (same border widths, same
// overflow). Only colors change, so the native view is never re-flattened and
// its children cannot be dropped when an alarm is toggled.
export function SurfaceCard({children, style, accentTop = false, subdued = false}) {
  const {colors, radius} = useTheme();
  const cardRadius = radius?.card || radius?.lg || 20;

  return (
    <View
      collapsable={false}
      style={[
        styles.card,
        {
          backgroundColor: subdued ? colors.surface : colors.surfaceRaised,
          borderColor: subdued ? colors.borderSubtle || colors.border : colors.border,
          borderRadius: cardRadius,
        },
        style,
      ]}>
      {accentTop ? (
        <View
          style={[
            styles.accentBar,
            {
              backgroundColor: colors.accent,
              borderTopLeftRadius: cardRadius,
              borderTopRightRadius: cardRadius,
            },
          ]}
        />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
    padding: spacing.md,
    position: 'relative',
  },
  accentBar: {
    height: 3,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
