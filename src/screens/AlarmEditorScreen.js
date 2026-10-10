import {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {PrimaryButton} from '../components/PrimaryButton';
import {DEFAULT_HOUR, DEFAULT_MINUTE} from '../constants/alarm';
import {spacing} from '../constants/theme';
import {saveAlarm} from '../services/alarmService';
import {useTheme} from '../theme/ThemeProvider';
import {formatClock, from24Hour, to24Hour} from '../utils/time';

export function AlarmEditorScreen({alarm, onClose}) {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const initial = from24Hour(alarm ? alarm.hour : DEFAULT_HOUR);
  const [hour12, setHour12] = useState(initial.hour12);
  const [minute, setMinute] = useState(alarm ? alarm.minute : DEFAULT_MINUTE);
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
      onClose();
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
      <Text style={[styles.kicker, {color: colors.accent}]}>WakeMind</Text>
      <Text style={[styles.title, {color: colors.text}]}>
        {alarm ? 'Edit alarm' : 'Add alarm'}
      </Text>
      <View style={styles.clockRow}>
        <Stepper
          label="Hour"
          value={clock.hourText}
          onDecrease={() =>
            setHour12(current => (current === 1 ? 12 : current - 1))
          }
          onIncrease={() =>
            setHour12(current => (current === 12 ? 1 : current + 1))
          }
        />
        <Text style={[styles.colon, {color: colors.text}]}>:</Text>
        <Stepper
          label="Minute"
          value={clock.minuteText}
          onDecrease={() => setMinute(current => (current === 0 ? 59 : current - 1))}
          onIncrease={() => setMinute(current => (current === 59 ? 0 : current + 1))}
        />
      </View>
      <View style={styles.periodRow}>
        <PeriodButton
          label="AM"
          selected={period === 'AM'}
          onPress={() => setPeriod('AM')}
        />
        <PeriodButton
          label="PM"
          selected={period === 'PM'}
          onPress={() => setPeriod('PM')}
        />
      </View>
      <Text style={[styles.hint, {color: colors.muted}]}>
        This is a one-time alarm. It rings once, then turns off.
      </Text>
      {error ? (
        <Text style={[styles.error, {color: colors.error}]}>{error}</Text>
      ) : null}
      <View style={styles.footer}>
        <PrimaryButton
          label={saving ? 'Saving…' : 'Save alarm'}
          disabled={saving}
          onPress={onSave}
        />
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={styles.cancel}>
          <Text style={[styles.cancelText, {color: colors.muted}]}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Stepper({label, value, onDecrease, onIncrease}) {
  const {colors} = useTheme();
  return (
    <View style={styles.stepper}>
      <Text style={[styles.stepperLabel, {color: colors.muted}]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label}`}
        onPress={onDecrease}
        style={[styles.step, {backgroundColor: colors.surfaceRaised}]}>
        <Text style={[styles.stepText, {color: colors.text}]}>−</Text>
      </Pressable>
      <Text style={[styles.stepValue, {color: colors.text}]}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label}`}
        onPress={onIncrease}
        style={[styles.step, {backgroundColor: colors.surfaceRaised}]}>
        <Text style={[styles.stepText, {color: colors.text}]}>+</Text>
      </Pressable>
    </View>
  );
}

function PeriodButton({label, selected, onPress}) {
  const {colors} = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.period,
        {
          borderColor: selected ? colors.accent : colors.line,
          backgroundColor: selected ? colors.accent : colors.background,
        },
      ]}>
      <Text
        style={[
          styles.periodText,
          {color: selected ? colors.accentText : colors.text},
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.lg,
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
  clockRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  colon: {
    fontSize: 48,
    fontWeight: '700',
    marginHorizontal: spacing.sm,
  },
  stepper: {
    alignItems: 'center',
  },
  stepperLabel: {
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  step: {
    alignItems: 'center',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 72,
  },
  stepText: {
    fontSize: 24,
    fontWeight: '600',
  },
  stepValue: {
    fontSize: 56,
    fontWeight: '700',
    marginVertical: spacing.sm,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  period: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: spacing.sm,
    minWidth: 88,
    paddingVertical: spacing.md,
  },
  periodText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
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
    marginTop: 'auto',
  },
  cancel: {
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
