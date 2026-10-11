import {StyleSheet, Text, View} from 'react-native';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';
import {formatArmingCountdown} from '../utils/countdown';
import {formatMissionTime} from '../utils/time';
import {AppIcon} from './AppIcon';
import {SurfaceCard} from './SurfaceCard';

export function NextMissionCard({alarm, now}) {
  const {colors, typography} = useTheme();

  if (!alarm) {
    return (
      <SurfaceCard>
        <Text style={[typography.cardHeading, {color: colors.accent}]}>
          NEXT MISSION PROTOCOL
        </Text>
        <Text style={[typography.bodyStrong, {color: colors.text, marginTop: spacing.sm}]}>
          No upcoming alarm
        </Text>
        <Text style={[typography.caption, {color: colors.muted, marginTop: spacing.xs}]}>
          Enable an alarm to see your next mission time here.
        </Text>
      </SurfaceCard>
    );
  }

  const mission = formatMissionTime(alarm.hour, alarm.minute);
  const countdown = formatArmingCountdown(alarm.triggerAtMillis, now);

  return (
    <SurfaceCard accentTop>
      <Text style={[typography.cardHeading, {color: colors.accent}]}>
        NEXT MISSION PROTOCOL
      </Text>
      <View style={styles.body}>
        <View style={styles.timeBlock}>
          <View style={styles.timeRow}>
            <Text style={[typography.missionTime, {color: colors.text}]}>
              {mission.timeText}
            </Text>
            <Text style={[typography.listPeriod, styles.period, {color: colors.accent}]}>
              {mission.period}
            </Text>
          </View>
          <View style={styles.countdownRow}>
            <AppIcon name="clock-outline" color={colors.muted} size={14} />
            <Text style={[typography.caption, {color: colors.textSoft}]}>{countdown}</Text>
          </View>
        </View>
        <View style={[styles.status, {backgroundColor: colors.surfaceDeep}]}>
          <AppIcon name="calendar-check" color={colors.accent} size={18} />
          <Text style={[typography.caption, styles.statusText, {color: colors.accent}]}>
            Scheduled
          </Text>
        </View>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  timeBlock: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  timeRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  period: {
    marginBottom: 8,
    marginLeft: spacing.sm,
  },
  countdownRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  status: {
    alignItems: 'center',
    borderRadius: 12,
    minWidth: 72,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  statusText: {
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
});
