import {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {PrimaryButton} from '../components/PrimaryButton';
import {
  DEFAULT_HOUR,
  DEFAULT_MINUTE,
} from '../constants/alarm';
import {colors, spacing} from '../constants/theme';
import {saveAlarm} from '../services/alarmService';
import {formatClock, from24Hour, to24Hour} from '../utils/time';

export function AlarmEditorScreen({alarm, onClose}) {
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
        {paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md},
      ]}>
      <Text style={styles.kicker}>WakeMind</Text>
      <Text style={styles.title}>{alarm ? 'Edit alarm' : 'Add alarm'}</Text>
      <View style={styles.clockRow}>
        <Stepper
          label="Hour"
          value={clock.hourText}
          onDecrease={() => setHour12(current => (current === 1 ? 12 : current - 1))}
          onIncrease={() => setHour12(current => (current === 12 ? 1 : current + 1))}
        />
        <Text style={styles.colon}>:</Text>
        <Stepper
          label="Minute"
          value={clock.minuteText}
          onDecrease={() => setMinute(current => (current === 0 ? 59 : current - 1))}
          onIncrease={() => setMinute(current => (current === 59 ? 0 : current + 1))}
        />
      </View>
      <View style={styles.periodRow}>
        <PeriodButton label="AM" selected={period === 'AM'} onPress={() => setPeriod('AM')} />
        <PeriodButton label="PM" selected={period === 'PM'} onPress={() => setPeriod('PM')} />
      </View>
      <Text style={styles.hint}>This is a one-time alarm. It rings once, then turns off.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.footer}>
        <PrimaryButton label={saving ? 'Saving…' : 'Save alarm'} disabled={saving} onPress={onSave} />
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.cancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Stepper({label, value, onDecrease, onIncrease}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label}`} onPress={onDecrease} style={styles.step}>
        <Text style={styles.stepText}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>{value}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label}`} onPress={onIncrease} style={styles.step}>
        <Text style={styles.stepText}>+</Text>
      </Pressable>
    </View>
  );
}

function PeriodButton({label, selected, onPress}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.period, selected && styles.periodSelected]}>
      <Text style={[styles.periodText, selected && styles.periodTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  kicker: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
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
    color: colors.text,
    fontSize: 48,
    fontWeight: '700',
    marginHorizontal: spacing.sm,
  },
  stepper: {
    alignItems: 'center',
  },
  stepperLabel: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  step: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 72,
  },
  stepText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '600',
  },
  stepValue: {
    color: colors.text,
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
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: spacing.sm,
    minWidth: 88,
    paddingVertical: spacing.md,
  },
  periodSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  periodText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  periodTextSelected: {
    color: colors.accentText,
  },
  hint: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
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
    color: colors.muted,
    fontSize: 16,
    fontWeight: '600',
  },
});
