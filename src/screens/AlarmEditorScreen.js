import {useState} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAlarms} from '../alarms/AlarmsProvider';
import {AppIcon} from '../components/AppIcon';
import {TimeWheels} from '../components/TimeWheels';
import {initialEditorSelection} from '../components/timePickerData';
import {
  DEFAULT_HOUR,
  DEFAULT_MINUTE,
  MAX_LABEL_LENGTH,
} from '../constants/alarm';
import {spacing} from '../constants/theme';
import {deleteAlarm, saveAlarm} from '../services/alarmService';
import {useTheme} from '../theme/ThemeProvider';
import {repeatLabel, soundLabel, to24Hour} from '../utils/time';

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
  const [label, setLabel] = useState(alarm ? alarm.label : 'Alarm');
  const [vibrate, setVibrate] = useState(alarm ? alarm.vibrate !== false : true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const busy = saving || deleting;
  const editing = Boolean(alarm && alarm.id);

  async function onSave() {
    if (busy) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      await saveAlarm({
        id: editing ? alarm.id : undefined,
        hour: to24Hour(hour12, period),
        minute,
        enabled: editing ? alarm.enabled : true,
        vibrate,
        label: label.trim(),
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
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.editorBackground,
          paddingTop: insets.top + spacing.sm,
          paddingBottom: insets.bottom + spacing.md,
        },
      ]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          disabled={saving}
          onPress={() => navigation.goBack()}
          style={[styles.round, {backgroundColor: colors.group}]}>
          <AppIcon name="close" color={colors.text} size={20} />
        </Pressable>
        <Text style={[styles.title, {color: colors.text}]}>
          {editing ? 'Edit Alarm' : 'Add Alarm'}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save alarm"
          accessibilityState={{disabled: busy}}
          disabled={busy}
          onPress={onSave}
          style={[styles.round, {backgroundColor: colors.accent}, busy && styles.dimmed]}>
          <AppIcon name="check" color={colors.accentText} size={22} />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <TimeWheels
          hour12={hour12}
          minute={minute}
          period={period}
          onHourChange={setHour12}
          onMinuteChange={setMinute}
          onPeriodChange={setPeriod}
        />
        <View style={[styles.group, {backgroundColor: colors.group}]}>
          <SettingRow label="Repeat" colors={colors}>
            <Text style={[styles.value, {color: colors.muted}]}>
              {repeatLabel(alarm && alarm.repeat ? alarm.repeat : 'once')}
            </Text>
          </SettingRow>
          <SettingDivider color={colors.background} />
          <SettingRow label="Label" colors={colors}>
            <TextInput
              accessibilityLabel="Label"
              maxLength={MAX_LABEL_LENGTH}
              onChangeText={setLabel}
              placeholder="Alarm"
              placeholderTextColor={colors.muted}
              style={[styles.input, {color: colors.text}]}
              value={label}
            />
          </SettingRow>
          <SettingDivider color={colors.background} />
          <SettingRow label="Sound" colors={colors}>
            <Text style={[styles.value, {color: colors.muted}]}>
              {soundLabel(alarm ? alarm.sound : 'system-alarm')}
            </Text>
          </SettingRow>
          <SettingDivider color={colors.background} />
          <SettingRow label="Vibrate" colors={colors}>
            <Switch
              accessibilityLabel={vibrate ? 'Turn vibration off' : 'Turn vibration on'}
              disabled={busy}
              onValueChange={setVibrate}
              thumbColor={colors.switchThumb}
              trackColor={{false: colors.switchOff, true: colors.success}}
              value={vibrate}
            />
          </SettingRow>
        </View>
        {error ? (
          <Text style={[styles.error, {color: colors.error}]}>{error}</Text>
        ) : null}
        {editing ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete alarm"
            disabled={busy}
            onPress={onDeletePress}
            style={[styles.delete, {backgroundColor: colors.group}, busy && styles.dimmed]}>
            <Text style={[styles.deleteText, {color: colors.danger}]}>
              {deleting ? 'Deleting…' : 'Delete Alarm'}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function SettingRow({label, colors, children}) {
  return (
    <View style={styles.settingRow}>
      <Text style={[styles.settingLabel, {color: colors.text}]}>{label}</Text>
      <View style={styles.settingValue}>{children}</View>
    </View>
  );
}

function SettingDivider({color}) {
  return <View style={[styles.settingDivider, {backgroundColor: color}]} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 48,
  },
  round: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  group: {
    borderRadius: 16,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  settingLabel: {
    fontSize: 17,
  },
  settingValue: {
    alignItems: 'flex-end',
    flex: 1,
    marginLeft: spacing.md,
  },
  settingDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.md,
  },
  value: {
    fontSize: 17,
  },
  input: {
    flex: 1,
    fontSize: 17,
    minHeight: 44,
    paddingVertical: 0,
    textAlign: 'right',
    width: '100%',
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  delete: {
    alignItems: 'center',
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 52,
  },
  deleteText: {
    fontSize: 17,
    fontWeight: '600',
  },
  dimmed: {
    opacity: 0.45,
  },
});
