import {useCallback, useMemo, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppIcon} from '../../components/AppIcon';
import {RepeatRoutineCard} from '../../components/RepeatRoutineCard';
import {ScreenContainer} from '../../components/ScreenContainer';
import {SurfaceCard} from '../../components/SurfaceCard';
import {spacing} from '../../constants/theme';
import {deleteAlarm, saveVisionRitual} from '../../services/alarmService';
import {showRadialTimePicker} from '../../services/timePickerService';
import {useTheme} from '../../theme/ThemeProvider';
import {
  applyConfirmedPickerResult,
  getNextMinuteSelection,
  initialEditorSelection,
} from '../../utils/editorTime';
import {to24Hour} from '../../utils/time';

const PRESET_TARGETS = [5, 10, 15, 20];
const DEFAULT_PLACEHOLDER =
  '• I am disciplined, focused, and relentless.\n• I execute my highest priorities today.\n• Action conquers all fear.';

function pad2(value) {
  return String(value).padStart(2, '0');
}

export function VisionRitualEditorScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const {colors, scheme, typography, radius} = useTheme();

  const ritual = route.params?.ritual ?? null;
  const isEditing = Boolean(ritual && ritual.id);

  const initialTime = useMemo(() => {
    if (ritual) {
      return initialEditorSelection(ritual.hour, ritual.minute);
    }
    return getNextMinuteSelection();
  }, [ritual]);

  const [hour12, setHour12] = useState(initialTime.hour12);
  const [minute, setMinute] = useState(initialTime.minute);
  const [period, setPeriod] = useState(initialTime.period);
  const [ritualText, setRitualText] = useState(ritual?.ritualText || '');
  const [repetitionTarget, setRepetitionTarget] = useState(
    ritual?.repetitionTarget || 10,
  );
  const [repeatDays, setRepeatDays] = useState(ritual?.repeatDays || []);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pickingTime, setPickingTime] = useState(false);
  const [error, setError] = useState('');

  const busy = saving || deleting || pickingTime;

  const openTimePicker = useCallback(async () => {
    if (busy) {return;}
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
      setError(pickerError?.message || 'The time picker could not open.');
    } finally {
      setPickingTime(false);
    }
  }, [busy, hour12, minute, period, scheme]);

  const handleSave = useCallback(async () => {
    if (busy) {return;}
    if (!ritualText.trim()) {
      setError('Please write your vision affirmation text.');
      return;
    }
    if (repetitionTarget < 1) {
      setError('Recitation target must be at least 1.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const hour24 = to24Hour(hour12, period);
      await saveVisionRitual({
        id: ritual?.id,
        hour: hour24,
        minute,
        enabled: ritual?.enabled !== false,
        vibrate: true,
        ritualText: ritualText.trim(),
        repetitionTarget,
        repeatDays,
      });
      navigation.goBack();
    } catch (saveError) {
      setError(saveError?.message || 'Failed to save Vision Ritual.');
    } finally {
      setSaving(false);
    }
  }, [
    busy,
    ritualText,
    repetitionTarget,
    hour12,
    period,
    ritual,
    minute,
    repeatDays,
    navigation,
  ]);

  const handleDelete = useCallback(() => {
    if (busy || !ritual?.id) {return;}
    Alert.alert(
      'Delete Vision Ritual',
      'Are you sure you want to delete this morning Vision Ritual?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            setError('');
            try {
              await deleteAlarm(ritual.id);
              navigation.goBack();
            } catch (delError) {
              setError(delError?.message || 'Failed to delete ritual.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }, [busy, ritual, navigation]);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, {paddingTop: Math.max(insets.top, 12)}]}>
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          disabled={busy}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <AppIcon color={colors.text} name="chevron-left" size={28} />
        </Pressable>

        <Text style={[typography.screenTitle, styles.headerTitle, {color: colors.text}]}>
          {isEditing ? 'Edit Vision Ritual' : 'New Vision Ritual'}
        </Text>

        <Pressable
          accessibilityLabel="Save Vision Ritual"
          accessibilityRole="button"
          disabled={busy}
          onPress={handleSave}
          style={[
            styles.saveBtn,
            {backgroundColor: colors.accent, borderRadius: radius.md},
            busy && styles.btnDisabled,
          ]}>
          <Text style={[typography.bodyStrong, {color: colors.accentText || '#0B111D'}]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </View>

      {/* Error banner */}
      {Boolean(error) && (
        <View style={[styles.errorBanner, {backgroundColor: colors.dangerSubtle || '#3B1820'}]}>
          <AppIcon color={colors.danger || '#EF4444'} name="alert-circle-outline" size={18} />
          <Text style={[typography.caption, styles.errorText, {color: colors.danger || '#EF4444'}]}>
            {error}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexOne}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {paddingBottom: insets.bottom + spacing.xl},
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* 1. Time Card */}
          <SurfaceCard style={[styles.card, {borderRadius: radius.lg}]}>
            <View style={styles.timeRow}>
              {/* Hours & Minutes click to open Radial Clock Picker */}
              <Pressable
                accessibilityLabel={`Time ${pad2(hour12)} ${pad2(minute)}. Tap to change.`}
                accessibilityRole="button"
                disabled={busy}
                onPress={openTimePicker}
                style={({pressed}) => [styles.digitsGroup, pressed && !busy && styles.pressed]}>
                <View style={styles.fieldCol}>
                  <View style={[styles.block, {backgroundColor: colors.surfaceDeep, borderRadius: radius.md}]}>
                    <Text style={[typography.editorTimeBlock, styles.timeText, {color: colors.text}]}>
                      {pad2(hour12)}
                    </Text>
                  </View>
                  <Text style={[typography.cardHeading, styles.fieldLabel, {color: colors.muted}]}>
                    HOURS
                  </Text>
                </View>

                <View style={styles.colon}>
                  <View style={[styles.dot, {backgroundColor: colors.accent}]} />
                  <View style={[styles.dot, {backgroundColor: colors.accent}]} />
                </View>

                <View style={styles.fieldCol}>
                  <View style={[styles.block, {backgroundColor: colors.surfaceDeep, borderRadius: radius.md}]}>
                    <Text style={[typography.editorTimeBlock, styles.timeText, {color: colors.text}]}>
                      {pad2(minute)}
                    </Text>
                  </View>
                  <Text style={[typography.cardHeading, styles.fieldLabel, {color: colors.muted}]}>
                    MINUTES
                  </Text>
                </View>
              </Pressable>

              {/* AM / PM Toggle Column */}
              <View style={styles.periodWrapper}>
                <View style={[styles.periodCol, {backgroundColor: colors.surfaceDeep, borderRadius: radius.md}]}>
                  <Pressable
                    accessibilityLabel="Select AM"
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() => setPeriod('AM')}
                    style={[
                      styles.periodHalf,
                      period === 'AM' && [
                        styles.periodActive,
                        {backgroundColor: colors.accent, borderRadius: radius.sm},
                      ],
                    ]}>
                    <Text
                      style={[
                        typography.bodyStrong,
                        styles.periodText,
                        {color: period === 'AM' ? (colors.accentText || '#0B111D') : colors.muted},
                      ]}>
                      AM
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Select PM"
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() => setPeriod('PM')}
                    style={[
                      styles.periodHalf,
                      period === 'PM' && [
                        styles.periodActive,
                        {backgroundColor: colors.accent, borderRadius: radius.sm},
                      ],
                    ]}>
                    <Text
                      style={[
                        typography.bodyStrong,
                        styles.periodText,
                        {color: period === 'PM' ? (colors.accentText || '#0B111D') : colors.muted},
                      ]}>
                      PM
                    </Text>
                  </Pressable>
                </View>
                <Text style={[typography.cardHeading, styles.fieldLabel, styles.invisibleLabel]}>
                  PER
                </Text>
              </View>
            </View>
          </SurfaceCard>

          {/* 2. Vision Affirmation Text Card */}
          <SurfaceCard style={[styles.card, {borderRadius: radius.lg}]}>
            <View style={styles.sectionHeader}>
              <AppIcon color={colors.accent} name="format-quote-open" size={20} />
              <Text style={[typography.cardHeading, {color: colors.accent}]}>
                VISION AFFIRMATION
              </Text>
            </View>
            <Text style={[typography.caption, styles.sectionSubtitle, {color: colors.textSoft}]}>
              Write the affirmation or goals you will recite out loud each morning.
            </Text>

            <TextInput
              accessibilityLabel="Vision affirmation text"
              editable={!busy}
              multiline
              onChangeText={setRitualText}
              placeholder={DEFAULT_PLACEHOLDER}
              placeholderTextColor={colors.muted}
              style={[
                styles.textArea,
                typography.body,
                {
                  backgroundColor: colors.surfaceDeep,
                  borderColor: colors.borderSubtle,
                  borderRadius: radius.md,
                  color: colors.text,
                },
              ]}
              textAlignVertical="top"
              value={ritualText}
            />
          </SurfaceCard>

          {/* 3. Recitation Target Card */}
          <SurfaceCard style={[styles.card, {borderRadius: radius.lg}]}>
            <View style={styles.sectionHeader}>
              <AppIcon color={colors.accent} name="repeat" size={20} />
              <Text style={[typography.cardHeading, {color: colors.accent}]}>
                RECITATION TARGET
              </Text>
            </View>
            <Text style={[typography.caption, styles.sectionSubtitle, {color: colors.textSoft}]}>
              Number of times to recite before the alarm completes.
            </Text>

            {/* Stepper */}
            <View style={styles.stepperRow}>
              <Pressable
                accessibilityLabel="Decrease recitation target"
                accessibilityRole="button"
                disabled={busy || repetitionTarget <= 1}
                onPress={() => setRepetitionTarget(t => Math.max(1, t - 1))}
                style={[
                  styles.stepperBtn,
                  {backgroundColor: colors.surfaceDeep, borderRadius: radius.md},
                  (busy || repetitionTarget <= 1) && styles.btnDisabled,
                ]}>
                <AppIcon color={colors.text} name="minus" size={20} />
              </Pressable>

              <View style={styles.stepperDisplay}>
                <Text style={[typography.screenTitle, styles.targetValue, {color: colors.accent}]}>
                  {repetitionTarget}
                </Text>
                <Text style={[typography.caption, {color: colors.muted}]}>
                  RECITATIONS
                </Text>
              </View>

              <Pressable
                accessibilityLabel="Increase recitation target"
                accessibilityRole="button"
                disabled={busy || repetitionTarget >= 99}
                onPress={() => setRepetitionTarget(t => Math.min(99, t + 1))}
                style={[
                  styles.stepperBtn,
                  {backgroundColor: colors.surfaceDeep, borderRadius: radius.md},
                  (busy || repetitionTarget >= 99) && styles.btnDisabled,
                ]}>
                <AppIcon color={colors.text} name="plus" size={20} />
              </Pressable>
            </View>

            {/* Quick Chips */}
            <View style={styles.chipsRow}>
              {PRESET_TARGETS.map(val => {
                const active = repetitionTarget === val;
                return (
                  <Pressable
                    key={`target-chip-${val}`}
                    accessibilityLabel={`Set ${val} recitations`}
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() => setRepetitionTarget(val)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.accent : colors.surfaceDeep,
                        borderColor: active ? colors.accent : colors.borderSubtle,
                        borderRadius: radius.sm,
                      },
                    ]}>
                    <Text
                      style={[
                        typography.bodyStrong,
                        styles.chipText,
                        {color: active ? (colors.accentText || '#0B111D') : colors.textSoft},
                      ]}>
                      {val}×
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </SurfaceCard>

          {/* 4. Repeat Routine */}
          <RepeatRoutineCard
            disabled={busy}
            onChange={setRepeatDays}
            selectedDays={repeatDays}
          />

          {/* 5. Delete Button (if editing) */}
          {isEditing && (
            <Pressable
              accessibilityLabel="Delete Vision Ritual"
              accessibilityRole="button"
              disabled={busy}
              onPress={handleDelete}
              style={[
                styles.deleteBtn,
                {borderColor: colors.danger || '#EF4444', borderRadius: radius.md},
              ]}>
              <AppIcon color={colors.danger || '#EF4444'} name="trash-can-outline" size={20} />
              <Text style={[typography.bodyStrong, {color: colors.danger || '#EF4444'}]}>
                {deleting ? 'Deleting...' : 'Delete Vision Ritual'}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    marginHorizontal: spacing.sm,
  },
  saveBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  errorBanner: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  errorText: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  card: {
    padding: spacing.md,
  },
  timeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  digitsGroup: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  fieldCol: {
    alignItems: 'center',
  },
  block: {
    alignItems: 'center',
    height: 84,
    justifyContent: 'center',
    minWidth: 84,
    paddingHorizontal: spacing.md,
  },
  timeText: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: 1,
    lineHeight: 56,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: spacing.sm,
  },
  colon: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    marginHorizontal: spacing.sm,
  },
  dot: {
    borderRadius: 3.5,
    height: 7,
    width: 7,
  },
  periodWrapper: {
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  periodCol: {
    height: 84,
    justifyContent: 'space-between',
    padding: 3,
    width: 48,
  },
  periodHalf: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  periodActive: {
    elevation: 2,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  invisibleLabel: {
    opacity: 0,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sectionSubtitle: {
    marginBottom: spacing.sm,
    marginTop: 4,
  },
  textArea: {
    borderWidth: 1,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 120,
    padding: spacing.md,
  },
  stepperRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  stepperBtn: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  stepperDisplay: {
    alignItems: 'center',
  },
  targetValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  chip: {
    borderWidth: 1,
    flex: 1,
    paddingVertical: spacing.xs + 2,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  deleteBtn: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.88,
  },
});
