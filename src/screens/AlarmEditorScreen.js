import {useCallback, useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAlarms} from '../alarms/AlarmsProvider';
import {EditorHeader} from '../components/EditorHeader';
import {EditorTimeCard} from '../components/EditorTimeCard';
import {RepeatRoutineCard} from '../components/RepeatRoutineCard';
import {ScreenContainer} from '../components/ScreenContainer';
import {SettingsDivider, SettingsRow} from '../components/SettingsRow';
import {SurfaceCard} from '../components/SurfaceCard';
import {
  DEFAULT_HOUR,
  DEFAULT_MINUTE,
} from '../constants/alarm';
import {spacing} from '../constants/theme';
import {deleteAlarm, saveAlarm} from '../services/alarmService';
import {showRadialTimePicker} from '../services/timePickerService';
import {useTheme} from '../theme/ThemeProvider';
import {
  applyConfirmedPickerResult,
  buildSavePayload,
  initialEditorSelection,
} from '../utils/editorTime';
import {soundLabel, to24Hour} from '../utils/time';

export function AlarmEditorScreen() {
  const route = useRoute();
  const alarm = route.params?.alarm ?? null;
  const session = alarm && alarm.id ? alarm.id : 'new';
  return <AlarmEditorForm key={session} alarm={alarm} />;
}

function AlarmEditorForm({alarm}) {
  const navigation = useNavigation();
  const {reload} = useAlarms();
  const {colors, scheme, typography} = useTheme();
  const insets = useSafeAreaInsets();
  const initial = initialEditorSelection(
    alarm ? alarm.hour : DEFAULT_HOUR,
    alarm ? alarm.minute : DEFAULT_MINUTE,
  );
  const [hour12, setHour12] = useState(initial.hour12);
  const [minute, setMinute] = useState(initial.minute);
  const [period, setPeriod] = useState(initial.period);
  const [label, setLabel] = useState(alarm ? alarm.label : 'Alarm');
  const [vibrate, setVibrate] = useState(alarm ? alarm.vibrate !== false : true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pickingTime, setPickingTime] = useState(false);
  const [error, setError] = useState('');
  const busy = saving || deleting || pickingTime;
  const editing = Boolean(alarm && alarm.id);

  const openTimePicker = useCallback(async () => {
    if (busy) {
      return;
    }
    setPickingTime(true);
    setError('');
    const draft = {hour12, minute, period};
    try {
      const result = await showRadialTimePicker({
        hour: to24Hour(hour12, period),
        minute,
        themeDark: scheme === 'dark',
      });
      const next = applyConfirmedPickerResult(draft, result);
      setHour12(next.hour12);
      setMinute(next.minute);
      setPeriod(next.period);
    } catch (pickerError) {
      setError(pickerError.message || 'The time picker could not open.');
    } finally {
      setPickingTime(false);
    }
  }, [busy, hour12, minute, period, scheme]);

  async function onSave() {
    if (busy) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      await saveAlarm(
        buildSavePayload({
          alarm,
          hour12,
          minute,
          period,
          label,
          vibrate,
          editing,
        }),
      );
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

  function onDeletePress() {
    if (!editing || busy) {
      return;
    }
    Alert.alert('Delete alarm', 'This alarm will be removed.', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: confirmDelete},
    ]);
  }

  async function confirmDelete() {
    if (deleting) {
      return;
    }
    setDeleting(true);
    setError('');
    try {
      await deleteAlarm(alarm.id);
      try {
        await reload();
      } catch (refreshError) {
        console.warn(
          'The alarm list could not be refreshed yet.',
          refreshError.message || 'Unknown refresh failure.',
        );
      }
      navigation.goBack();
    } catch (deleteError) {
      setError(deleteError.message || 'The alarm could not be deleted.');
      setDeleting(false);
    }
  }

  return (
    <ScreenContainer style={styles.screen} edges={[]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl},
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <EditorHeader
          onCancel={() => navigation.goBack()}
          onSave={onSave}
          saveDisabled={busy}
          subtitle="B-DISCIPLINE · VISION LOCK"
          title={editing ? 'Edit Alarm' : 'Add Alarm'}
        />
        <EditorTimeCard
          disabled={busy}
          hour12={hour12}
          label={label}
          minute={minute}
          onLabelChange={setLabel}
          onPressTime={openTimePicker}
          period={period}
        />
        <RepeatRoutineCard />
        <SurfaceCard style={styles.settings}>
          <SettingsRow
            icon="bell-outline"
            subtitle="System default ringtone"
            title="Alarm Sound"
            trailing={soundLabel(alarm ? alarm.sound : 'system-alarm')}
          />
          <SettingsDivider />
          <SettingsRow
            disabled={busy}
            icon="vibrate"
            onSwitchChange={setVibrate}
            subtitle="Use vibration when the alarm rings"
            switchValue={vibrate}
            title="Haptic Vibration"
          />
          <SettingsDivider />
          <SettingsRow
            badge="STRICT"
            icon="clock-outline"
            subtitle="Snooze is not available in this release"
            title="Discipline Snooze"
            trailing="Not available"
          />
        </SurfaceCard>
        {error ? (
          <Text style={[styles.error, {color: colors.error}]}>{error}</Text>
        ) : null}
        {editing ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete alarm"
            accessibilityState={{disabled: busy}}
            disabled={busy}
            onPress={onDeletePress}
            style={styles.deleteHit}>
            <Text style={[typography.bodyStrong, styles.delete, {color: colors.danger}]}>
              {deleting ? 'Deleting…' : 'Delete Alarm'}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: spacing.md,
  },
  content: {
    flexGrow: 1,
  },
  settings: {
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  deleteHit: {
    alignItems: 'center',
    marginTop: spacing.xl,
    minHeight: 44,
    justifyContent: 'center',
  },
  delete: {
    textAlign: 'center',
  },
});
