import {useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAlarms} from '../alarms/AlarmsProvider';
import {PrimaryButton} from '../components/PrimaryButton';
import {TimeWheels} from '../components/TimeWheels';
import {DEFAULT_HOUR, DEFAULT_MINUTE} from '../constants/alarm';
import {spacing} from '../constants/theme';
import {saveAlarm} from '../services/alarmService';
import {useTheme} from '../theme/ThemeProvider';
import {formatClock, to24Hour} from '../utils/time';
import {initialEditorSelection} from '../components/timePickerData';

export function AlarmEditorScreen() {
  const route = useRoute();
  const alarm = route.params?.alarm ?? null;
  const session = alarm && alarm.id ? alarm.id : 'new';
  return <AlarmEditorForm key={session} alarm={alarm} />;
}

function AlarmEditorForm({alarm}) {
  const navigation = useNavigation();
  const {reload} = useAlarms();
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const initial = initialEditorSelection(
    alarm ? alarm.hour : DEFAULT_HOUR,
    alarm ? alarm.minute : DEFAULT_MINUTE,
  );
  const [hour12, setHour12] = useState(initial.hour12);
  const [minute, setMinute] = useState(initial.minute);
  const [period, setPeriod] = useState(initial.period);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const clock = formatClock(to24Hour(hour12, period), minute);

  async function onSave() {
    setSaving(true);
    setError('');
    try {
      await saveAlarm({
        id: alarm ? alarm.id : undefined,
        hour: to24Hour(hour12, period),
        minute,
        enabled: true,
        vibrate: alarm ? alarm.vibrate : true,
        label: alarm ? alarm.label : 'Alarm',
      });
      try {
        await reload();
      } catch (refreshError) {
        console.warn(
          'The saved alarm could not be refreshed yet.',
          refreshError.message || 'Unknown refresh failure.',
        );
      }
      navigation.goBack();
    } catch (saveError) {
      setError(saveError.message || 'The alarm could not be saved.');
      setSaving(false);
    }
  }

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.md,
        },
      ]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Text style={[styles.kicker, {color: colors.accent}]}>WakeMind</Text>
        <Text style={[styles.title, {color: colors.text}]}>
          {alarm ? 'Edit alarm' : 'Add alarm'}
        </Text>
        <Text
          accessibilityLabel={`Selected time ${clock.hourText}:${clock.minuteText} ${clock.period}`}
          style={[styles.readout, {color: colors.text}]}>
          {clock.hourText}:{clock.minuteText}
          <Text style={[styles.readoutPeriod, {color: colors.muted}]}>
            {' '}
            {clock.period}
          </Text>
        </Text>
        <TimeWheels
          hour12={hour12}
          minute={minute}
          period={period}
          onHourChange={setHour12}
          onMinuteChange={setMinute}
          onPeriodChange={setPeriod}
        />
        <Text style={[styles.hint, {color: colors.muted}]}>
          This is a one-time alarm. It rings once, then turns off.
        </Text>
        {error ? (
          <Text style={[styles.error, {color: colors.error}]}>{error}</Text>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton
          label={saving ? 'Saving…' : 'Save alarm'}
          disabled={saving}
          onPress={onSave}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          onPress={() => navigation.goBack()}
          style={styles.cancel}>
          <Text style={[styles.cancelText, {color: colors.muted}]}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flexGrow: 1,
    paddingBottom: spacing.md,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  readout: {
    fontSize: 40,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  readoutPeriod: {
    fontSize: 18,
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  footer: {
    paddingTop: spacing.sm,
  },
  cancel: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
