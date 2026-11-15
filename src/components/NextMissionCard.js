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
      <SurfaceCard style={styles.card}>
        <Text style={[typography.cardHeading, {color: colors.accent}]}>
          NEXT MISSION PROTOCOL
        </Text>
        <View style={styles.body}>
          <View style={styles.timeBlock}>
            <View style={styles.timeRow}>
              <Text style={[typography.missionTime, {color: colors.muted}]}>
                --:--
              </Text>
            </View>
            <View style={styles.countdownRow}>
              <AppIcon name="clock-outline" color={colors.muted} size={14} />
              <Text style={[typography.caption, {color: colors.muted}]}>
                No active alarm scheduled
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.status,
              {
                backgroundColor: colors.surfaceElevated || colors.surfaceDeep,
                borderColor: colors.borderSubtle || colors.border,
              },
            ]}>
            <AppIcon name="clock-outline" color={colors.muted} size={22} />
            <Text style={[styles.statusText, {color: colors.muted}]}>
              STANDBY
            </Text>
          </View>
        </View>
      </SurfaceCard>
    );
  }

  const mission = formatMissionTime(alarm.hour, alarm.minute);
  const countdown = formatArmingCountdown(alarm.triggerAtMillis, now);

  return (
    <SurfaceCard style={styles.card}>
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
            <AppIcon
              name="clock-outline"
              color={colors.accentBlue || '#38BDF8'}
              size={14}
            />
            <Text style={[typography.caption, {color: colors.muted}]}>
              Arming in{' '}
              <Text style={{color: colors.text, fontWeight: '700'}}>
                {countdown.replace(/^Arming in\s*/i, '')}
              </Text>
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.status,
            {
              backgroundColor: colors.surfaceElevated || colors.surfaceDeep,
              borderColor: colors.borderSubtle || colors.border,
            },
          ]}>
          <AppIcon name="medal" color={colors.accent} size={22} />
          <Text style={[styles.statusText, {color: colors.textSubtle || '#94A3B8'}]}>
            LOCKED
          </Text>
        </View>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
  },
  body: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeBlock: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  timeRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  period: {
    marginBottom: 5,
    marginLeft: 6,
  },
  countdownRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  status: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 3,
    textTransform: 'uppercase',
  },
});
