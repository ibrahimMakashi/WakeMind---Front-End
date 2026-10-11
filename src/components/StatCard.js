import {StyleSheet, Text, View} from 'react-native';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';
import {AppIcon} from './AppIcon';
import {SurfaceCard} from './SurfaceCard';

export function StatCard({title, value, detail, icon}) {
  const {colors, typography} = useTheme();
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.header}>
        <Text style={[typography.cardHeading, {color: colors.muted}]}>{title}</Text>
        <AppIcon name={icon} color={colors.muted} size={16} />
      </View>
      <Text style={[typography.statValue, {color: colors.text}]}>{value}</Text>
      <Text style={[typography.caption, {color: colors.textSoft}]}>{detail}</Text>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 100,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
});
