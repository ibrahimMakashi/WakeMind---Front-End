import {StyleSheet, Text, View} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';
import {AppIcon} from './AppIcon';
import {SurfaceCard} from './SurfaceCard';

export function StatCard({
  title,
  value,
  unit,
  detail,
  icon,
  iconColor,
  unitColor,
  detailColor,
}) {
  const {colors, typography} = useTheme();
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.header}>
        <Text style={[typography.cardHeading, {color: colors.muted}]}>{title}</Text>
        {icon ? (
          <AppIcon name={icon} color={iconColor || colors.muted} size={16} />
        ) : null}
      </View>
      <View style={styles.valueRow}>
        <Text style={[typography.statValue, {color: colors.text}]}>{value}</Text>
        {unit ? (
          <Text style={[styles.unit, {color: unitColor || colors.accent}]}>
            {unit}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.detail, {color: detailColor || colors.textSoft}]}>
        {detail}
      </Text>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    flex: 1,
    minHeight: 96,
    padding: 14,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  valueRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  unit: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
    marginLeft: 4,
  },
  detail: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
});
