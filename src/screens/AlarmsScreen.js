import {useCallback, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAlarms} from '../alarms/AlarmsProvider';
import {AlarmCard} from '../components/AlarmCard';
import {BrandHeader} from '../components/BrandHeader';
import {FAB_BOTTOM_GAP, FAB_SIZE, FloatingAddButton} from '../components/FloatingAddButton';
import {NextMissionCard} from '../components/NextMissionCard';
import {SectionHeader} from '../components/SectionHeader';
import {StatCard} from '../components/StatCard';
import {spacing} from '../constants/theme';
import {useCountdownTo} from '../hooks/useCountdownTo';
import {useTheme} from '../theme/ThemeProvider';
import {nextAlarm, sortAlarms} from '../utils/time';

export function AlarmsScreen() {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const {alarms, loadError, busy, reload, toggleEnabled} = useAlarms();
  const [error, setError] = useState('');
  const [pendingToggles, setPendingToggles] = useState({});
  const orderedAlarms = useMemo(() => sortAlarms(alarms), [alarms]);
  const upcoming = nextAlarm(alarms);
  const now = useCountdownTo(upcoming ? upcoming.triggerAtMillis : null);
  const listBottom = insets.bottom + FAB_SIZE + FAB_BOTTOM_GAP + 28;

  // Streak days: connects to existing adherence count or default
  const streakDays = 14;

  const avgWake = useMemo(() => {
    if (upcoming) {
      const h = upcoming.hour % 12 || 12;
      const m = String(upcoming.minute).padStart(2, '0');
      const period = upcoming.hour >= 12 ? 'PM' : 'AM';
      return {
        time: `${h}:${m}`,
        period,
        detail: '+12m vs goal',
      };
    }
    return {
      time: '5:58',
      period: 'AM',
      detail: '+12m vs goal',
    };
  }, [upcoming]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      reload().catch(refreshError => {
        if (active) {
          setError(refreshError.message || 'Alarms could not be loaded.');
        }
      });
      return () => {
        active = false;
      };
    }, [reload]),
  );

  async function onToggle(id, enabled) {
    setError('');
    setPendingToggles(current => ({...current, [id]: true}));
    try {
      await toggleEnabled(id, enabled);
    } catch (actionError) {
      setError(actionError.message || 'Something went wrong.');
    } finally {
      setPendingToggles(current => {
        if (!current[id]) {
          return current;
        }
        const next = {...current};
        delete next[id];
        return next;
      });
    }
  }

  const listHeader = useMemo(
    () => (
      <View>
        <BrandHeader subtitle="ALARMS" />

        <SectionHeader
          label="ACTIVE OBJECTIVE"
          right={
            <View
              style={[
                styles.streakBadge,
                {
                  backgroundColor: colors.surfaceElevated || '#141C2B',
                  borderColor: colors.borderSubtle || '#243046',
                },
              ]}>
              <Text style={[styles.streakText, {color: colors.accent}]}>
                🔥 {streakDays} Day Streak
              </Text>
            </View>
          }
          style={styles.objectiveHeader}
        />

        <NextMissionCard alarm={upcoming} now={now} />

        <View style={styles.statsRow}>
          <StatCard
            detail={avgWake.detail}
            detailColor={colors.accentBlue || '#38BDF8'}
            icon="clock-outline"
            iconColor={colors.accentBlue || '#38BDF8'}
            title="AVG WAKE"
            unit={avgWake.period}
            unitColor={colors.accent}
            value={avgWake.time}
          />
          <View style={styles.statGap} />
          <StatCard
            detail="100% adherence"
            detailColor={colors.accent}
            icon="puzzle-outline"
            iconColor={colors.accent}
            title="MISSIONS DONE"
            unit="puzzles"
            unitColor={colors.textSubtle || '#8A99AD'}
            value="42"
          />
        </View>

        <SectionHeader
          label="SCHEDULED ALARMS"
          meta={`${orderedAlarms.length} Configured`}
          style={styles.scheduledHeader}
        />

        {error || loadError ? (
          <Text style={[styles.error, {color: colors.error}]}>{error || loadError}</Text>
        ) : null}

        {orderedAlarms.length === 0 ? (
          <Text style={[styles.empty, {color: colors.muted}]}>
            No alarms yet. Tap + to schedule your first mission.
          </Text>
        ) : null}
      </View>
    ),
    [
      avgWake.detail,
      avgWake.period,
      avgWake.time,
      colors.accent,
      colors.accentBlue,
      colors.borderSubtle,
      colors.error,
      colors.muted,
      colors.surfaceElevated,
      colors.textSubtle,
      error,
      loadError,
      now,
      orderedAlarms.length,
      streakDays,
      upcoming,
    ],
  );

  return (
    <View style={[styles.screen, {backgroundColor: colors.background}]}>
      <ScrollView
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: insets.top + spacing.xs,
            paddingBottom: listBottom,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {listHeader}
        {orderedAlarms.map(alarm => (
          <AlarmCard
            key={alarm.id}
            alarm={alarm}
            onEdit={() => {
              if (pendingToggles[alarm.id]) {
                return;
              }
              navigation.navigate('Editor', {alarm});
            }}
            onToggle={enabled => onToggle(alarm.id, enabled)}
            toggling={Boolean(pendingToggles[alarm.id])}
          />
        ))}
      </ScrollView>
      <FloatingAddButton
        disabled={busy}
        onPress={() => navigation.navigate('Editor', {alarm: null})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  objectiveHeader: {
    marginBottom: 10,
    marginTop: 16,
  },
  streakBadge: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  statGap: {
    width: 12,
  },
  scheduledHeader: {
    marginBottom: 12,
    marginTop: 20,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
});
