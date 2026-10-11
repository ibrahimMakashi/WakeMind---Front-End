import {StyleSheet, Switch, Text, View} from 'react-native';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';
import {AppIcon} from './AppIcon';

export function SettingsRow({
  icon,
  title,
  subtitle,
  trailing,
  switchValue,
  onSwitchChange,
  disabled,
  badge,
}) {
  const {colors, typography, radius} = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.iconTile, {backgroundColor: colors.surfaceDeep, borderRadius: radius.icon}]}>
        <AppIcon name={icon} color={colors.accent} size={20} />
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={[typography.bodyStrong, {color: colors.text}]}>{title}</Text>
          {badge ? (
            <View style={[styles.badge, {borderColor: colors.danger}]}>
              <Text style={[typography.caption, styles.badgeText, {color: colors.danger}]}>
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
        {subtitle ? (
          <Text style={[typography.caption, {color: colors.muted}]}>{subtitle}</Text>
        ) : null}
      </View>
      <View style={styles.trailing}>
        {typeof switchValue === 'boolean' ? (
          <Switch
            accessibilityLabel={title}
            disabled={disabled}
            onValueChange={onSwitchChange}
            thumbColor={colors.switchThumb}
            trackColor={{false: colors.switchOff, true: colors.accent}}
            value={switchValue}
          />
        ) : (
          <Text style={[typography.caption, styles.trailingText, {color: colors.textSoft}]}>
            {trailing}
          </Text>
        )}
      </View>
    </View>
  );
}

export function SettingsDivider() {
  const {colors} = useTheme();
  return <View style={[styles.divider, {backgroundColor: colors.border}]} />;
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 64,
    paddingVertical: spacing.sm,
  },
  iconTile: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  copy: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badge: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  trailing: {
    alignItems: 'flex-end',
    minWidth: 64,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
  },
  badgeText: {
    fontWeight: '700',
  },
  trailingText: {
    fontWeight: '600',
  },
});
