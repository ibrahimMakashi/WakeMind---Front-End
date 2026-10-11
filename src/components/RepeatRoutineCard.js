import {StyleSheet, Text, View} from 'react-native';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';
import {SurfaceCard} from './SurfaceCard';

export function RepeatRoutineCard() {
  const {colors, typography} = useTheme();
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.header}>
        <Text style={[typography.sectionLabel, {color: colors.muted}]}>REPEAT ROUTINE</Text>
        <Text style={[typography.caption, styles.summary, {color: colors.accent}]}>
          Once
        </Text>
      </View>
      <Text style={[typography.caption, {color: colors.textSoft, marginTop: spacing.sm}]}>
        Recurring weekday alarms are not available yet. This alarm will ring once at the
        scheduled time.
      </Text>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summary: {
    fontWeight: '700',
  },
});
