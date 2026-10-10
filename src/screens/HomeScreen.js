import {useCallback, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAlarms} from '../alarms/AlarmsProvider';
import {CapabilityNotices} from '../components/CapabilityNotices';
import {PrimaryButton} from '../components/PrimaryButton';
import {TEST_ALARM_OFFSET_SECONDS} from '../constants/alarm';
import {spacing} from '../constants/theme';
import {scheduleTestAlarm} from '../services/alarmService';
import {useTheme} from '../theme/ThemeProvider';
import {formatClock, nextAlarm, relativeDayLabel} from '../utils/time';

export function HomeScreen() {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const {alarms, capability, loadError, busy, reload, run} = useAlarms();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const upcoming = nextAlarm(alarms);

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

  async function runAction(action) {
    setError('');
    setMessage('');
    try {
      const result = await run(action);
      if (typeof result === 'string') {
        setMessage(result);
      }
    } catch (actionError) {
      setError(actionError.message || 'Something went wrong.');
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {paddingTop: insets.top + spacing.lg, paddingBottom: spacing.xl},
      ]}
      style={[styles.screen, {backgroundColor: colors.background}]}>
      <Text style={[styles.kicker, {color: colors.accent}]}>WakeMind</Text>
      <Text style={[styles.heading, {color: colors.muted}]}>Next alarm</Text>
      <NextAlarm alarm={upcoming} />
      {message ? (
        <Text style={[styles.message, {color: colors.success}]}>{message}</Text>
      ) : null}
      {error || loadError ? (
        <Text style={[styles.message, {color: colors.error}]}>
          {error || loadError}
        </Text>
      ) : null}
      <CapabilityNotices
        capability={capability}
        disabled={busy}
        onError={setError}
      />
      <View style={styles.actions}>
        <PrimaryButton
          label="Add Alarm"
          disabled={busy}
          onPress={() => navigation.navigate('Editor', {alarm: null})}
        />
        <View style={styles.gap} />
        <PrimaryButton
          label="Test Alarm"
          disabled={busy}
          onPress={() =>
            runAction(async () => {
              const saved = await scheduleTestAlarm(TEST_ALARM_OFFSET_SECONDS);
              const clock = formatClock(saved.hour, saved.minute);
              return `Test alarm set for ${clock.hourText}:${clock.minuteText} ${clock.period}. You can leave the app.`;
            })
          }
        />
      </View>
    </ScrollView>
  );
}

function NextAlarm({alarm}) {
  const {colors} = useTheme();
  if (!alarm) {
    return (
      <View style={styles.nextCard}>
        <Text style={[styles.nextEmpty, {color: colors.text}]}>
          No upcoming alarm
        </Text>
        <Text style={[styles.nextDetail, {color: colors.muted}]}>
          Add an alarm when you want WakeMind to wake you.
        </Text>
      </View>
    );
  }
  const clock = formatClock(alarm.hour, alarm.minute);
  return (
    <View style={styles.nextCard}>
      <Text
        accessibilityLabel={`Next alarm ${clock.hourText}:${clock.minuteText} ${clock.period}`}
        style={[styles.nextTime, {color: colors.text}]}>
        {clock.hourText}:{clock.minuteText}
        <Text style={[styles.nextPeriod, {color: colors.muted}]}>
          {' '}
          {clock.period}
        </Text>
      </Text>
      <Text style={[styles.nextDay, {color: colors.muted}]}>
        {alarm.label} · {relativeDayLabel(alarm.triggerAtMillis)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: spacing.lg,
    textTransform: 'uppercase',
  },
  nextCard: {
    marginTop: spacing.sm,
  },
  nextTime: {
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: -2,
  },
  nextPeriod: {
    fontSize: 22,
    letterSpacing: 0,
  },
  nextDay: {
    fontSize: 18,
    marginTop: spacing.xs,
  },
  nextEmpty: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  nextDetail: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  message: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: spacing.md,
  },
  actions: {
    marginTop: spacing.lg,
  },
  gap: {
    height: spacing.sm,
  },
});
