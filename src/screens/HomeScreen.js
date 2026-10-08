import {useCallback, useEffect, useState} from 'react';
import {
  AppState,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AlarmCard} from '../components/AlarmCard';
import {PrimaryButton} from '../components/PrimaryButton';
import {TEST_ALARM_OFFSET_SECONDS} from '../constants/alarm';
import {colors, spacing} from '../constants/theme';
import {
  deleteAlarm,
  getAlarms,
  getCapabilityStatus,
  openExactAlarmSettings,
  openFullScreenIntentSettings,
  scheduleTestAlarm,
  setAlarmEnabled,
} from '../services/alarmService';
import {formatClock, nextAlarm, relativeDayLabel} from '../utils/time';

export function HomeScreen({onAdd, onEdit}) {
  const insets = useSafeAreaInsets();
  const [alarms, setAlarms] = useState([]);
  const [capability, setCapability] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const upcoming = nextAlarm(alarms);

  const reload = useCallback(async () => {
    const [nextAlarms, nextCapability] = await Promise.all([
      getAlarms(),
      getCapabilityStatus(),
    ]);
    setAlarms(nextAlarms);
    setCapability(nextCapability);
  }, []);

  useEffect(() => {
    let active = true;
    async function load(requestPermission) {
      try {
        if (
          requestPermission &&
          Platform.OS === 'android' &&
          Number(Platform.Version) >= 33
        ) {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
        }
        if (active) {
          await reload();
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Alarms could not be loaded.');
        }
      }
    }
    load(true);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        load(false);
      }
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [reload]);

  async function run(action) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const resultMessage = await action();
      if (typeof resultMessage === 'string') {
        setMessage(resultMessage);
      }
      await reload();
    } catch (actionError) {
      setError(actionError.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg},
      ]}
      style={styles.screen}>
      <Text style={styles.kicker}>WakeMind</Text>
      <Text style={styles.heading}>Next alarm</Text>
      <NextAlarm alarm={upcoming} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <CapabilityNotices capability={capability} disabled={busy} />
      <View style={styles.actions}>
        <PrimaryButton
          label="Test Alarm"
          disabled={busy}
          onPress={() =>
            run(async () => {
              const saved = await scheduleTestAlarm(TEST_ALARM_OFFSET_SECONDS);
              const clock = formatClock(saved.hour, saved.minute);
              return `Test alarm set for ${clock.hourText}:${clock.minuteText} ${clock.period}. You can leave the app.`;
            })
          }
        />
        <View style={styles.gap} />
        <PrimaryButton label="Add Alarm" disabled={busy} onPress={onAdd} />
      </View>
      <Text style={styles.section}>My alarms</Text>
      {alarms.length === 0 ? (
        <Text style={styles.empty}>No alarms yet.</Text>
      ) : (
        alarms.map(alarm => (
          <AlarmCard
            key={alarm.id}
            alarm={alarm}
            disabled={busy}
            onToggle={enabled => run(() => setAlarmEnabled(alarm.id, enabled))}
            onEdit={() => onEdit(alarm)}
            onDelete={() => run(() => deleteAlarm(alarm.id))}
          />
        ))
      )}
    </ScrollView>
  );
}

function NextAlarm({alarm}) {
  if (!alarm) {
    return (
      <View style={styles.nextCard}>
        <Text style={styles.nextEmpty}>No upcoming alarm</Text>
      </View>
    );
  }
  const clock = formatClock(alarm.hour, alarm.minute);
  return (
    <View style={styles.nextCard}>
      <Text style={styles.nextTime}>
        {clock.hourText}:{clock.minuteText}
        <Text style={styles.nextPeriod}> {clock.period}</Text>
      </Text>
      <Text style={styles.nextDay}>{relativeDayLabel(alarm.triggerAtMillis)}</Text>
    </View>
  );
}

function CapabilityNotices({capability, disabled}) {
  if (!capability) {
    return null;
  }
  return (
    <View>
      {capability.exactAlarm === 'needsScheduleExactAlarmGrant' ? (
        <Notice
          text="Android 12 needs Alarms & reminders before WakeMind can schedule an exact alarm."
          actionLabel="Open settings"
          disabled={disabled}
          onPress={() => openExactAlarmSettings()}
        />
      ) : null}
      {capability.exactAlarm === 'unavailable' ? (
        <Notice text="Exact alarms are blocked on this device. WakeMind did not open the Android 12 settings page because this Android version uses a different permission." />
      ) : null}
      {capability.fullScreenIntent === 'needsSettings' ? (
        <Notice
          text="Allow full-screen notifications so the alarm can appear on the lock screen."
          actionLabel="Open settings"
          disabled={disabled}
          onPress={() => openFullScreenIntentSettings()}
        />
      ) : null}
      {capability.notifications === 'denied' ? (
        <Notice text="Notifications are off. The alarm sound can still start, but the lock-screen alert may not appear until notifications are allowed." />
      ) : null}
    </View>
  );
}

function Notice({text, actionLabel, onPress, disabled}) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeText}>{text}</Text>
      {actionLabel ? (
        <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}>
          <Text style={styles.noticeAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  kicker: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heading: {
    color: colors.muted,
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
    color: colors.text,
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: -2,
  },
  nextPeriod: {
    color: colors.muted,
    fontSize: 22,
    letterSpacing: 0,
  },
  nextDay: {
    color: colors.muted,
    fontSize: 18,
    marginTop: spacing.xs,
  },
  nextEmpty: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  message: {
    color: colors.success,
    fontSize: 15,
    lineHeight: 21,
    marginTop: spacing.md,
  },
  error: {
    color: colors.danger,
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
  section: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: spacing.md,
    marginTop: spacing.xl,
    textTransform: 'uppercase',
  },
  empty: {
    color: colors.muted,
    fontSize: 16,
  },
  notice: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  noticeText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  noticeAction: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
});
