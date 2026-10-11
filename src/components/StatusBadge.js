import {StyleSheet, Text, View} from 'react-native';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';
import {AppIcon} from './AppIcon';

export function StatusBadge({label, icon, muted = false}) {
  const {colors, typography, radius} = useTheme();
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.surfaceDeep,
          borderColor: colors.border,
          borderRadius: radius.pill,
        },
      ]}>
      {icon ? (
        <AppIcon
          name={icon}
          color={muted ? colors.muted : colors.accent}
          size={14}
        />
      ) : null}
      <Text
        style={[
          typography.caption,
          styles.label,
          {color: muted ? colors.muted : colors.textSoft},
        ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  label: {
    fontWeight: '600',
  },
});
