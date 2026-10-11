import {useCallback, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAlarms} from '../alarms/AlarmsProvider';
import {AlarmCard} from '../components/AlarmCard';
import {BrandHeader} from '../components/BrandHeader';
import {FloatingAddButton} from '../components/FloatingAddButton';
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
  const [togglingId, setTogglingId] = useState('');
  const orderedAlarms = useMemo(() => sortAlarms(alarms), [alarms]);
  const upcoming = nextAlarm(alarms);
  const now = useCountdownTo(upcoming ? upcoming.triggerAtMillis : null);
  const listBottom = insets.bottom + 72;

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
    setTogglingId(id);
    try {
      await toggleEnabled(id, enabled);
    } catch (actionError) {
      setError(actionError.message || 'Something went wrong.');
    } finally {
      setTogglingId('');
    }
  }

  const listHeader = useMemo(
    () => (
      <View>
        <BrandHeader />
        <SectionHeader label="ACTIVE OBJECTIVE" />
        <NextMissionCard alarm={upcoming} now={now} />
        <View style={styles.statsRow}>
          <StatCard
            detail="Wake analytics are not tracked yet"
            icon="clock-outline"
            title="AVG WAKE"
            value="—"
          />
          <View style={styles.statGap} />
          <StatCard
            detail="Mission history is not tracked yet"
            icon="puzzle-outline"
            title="MISSIONS DONE"
            value="—"
          />
        </View>
        <SectionHeader
          label="SCHEDULED ALARMS"
          meta={`${orderedAlarms.length} Configured`}
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
    [colors.error, colors.muted, error, loadError, now, orderedAlarms.length, upcoming],
  );

  return (
    <View style={[styles.screen, {backgroundColor: colors.background}]}>
      <ScrollView
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: listBottom,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {listHeader}
        {orderedAlarms.map(alarm => (
          <AlarmCard
            key={alarm.id}
            alarm={alarm}
            onEdit={() => navigation.navigate('Editor', {alarm})}
            onToggle={enabled => onToggle(alarm.id, enabled)}
            toggling={togglingId === alarm.id}
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
    paddingHorizontal: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  statGap: {
    width: spacing.sm,
  },
  error: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: spacing.sm,
  },
  empty: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
});
