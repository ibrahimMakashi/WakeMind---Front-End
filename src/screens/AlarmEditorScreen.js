import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAlarms} from '../alarms/AlarmsProvider';
import {AppIcon} from '../components/AppIcon';
import {EditorHeader} from '../components/EditorHeader';
import {EditorTimeCard} from '../components/EditorTimeCard';
import {ImageGalleryModal} from '../components/puzzle/ImageGalleryModal';
import {WakeUpVisionMissionCard} from '../components/puzzle/WakeUpVisionMissionCard';
import {RepeatRoutineCard} from '../components/RepeatRoutineCard';
import {ScreenContainer} from '../components/ScreenContainer';
import {SettingsDivider, SettingsRow} from '../components/SettingsRow';
import {SoundSelectionModal} from '../components/sound/SoundSelectionModal';
import {SurfaceCard} from '../components/SurfaceCard';
import {DEFAULT_ALARM_SOUND_ID, findAlarmSound} from '../constants/alarmSounds';
import {spacing} from '../constants/theme';
import {usePuzzleImageLibrary} from '../hooks/usePuzzleImageLibrary';
import {
  DEFAULT_PUZZLE_IMAGE_ID,
  DEFAULT_PUZZLE_IMAGE_TYPE,
  resolveImageSource,
} from '../puzzle/imageCatalog';
import {pickImageFromPhone} from '../puzzle/imageStorage';
import {deleteAlarm, saveAlarm, stopAudioPreview} from '../services/alarmService';
import {showRadialTimePicker} from '../services/timePickerService';
import {useTheme} from '../theme/ThemeProvider';
import {buildAlarmSaveToast} from '../utils/alarmCountdown';
import {
  applyConfirmedPickerResult,
  buildSavePayload,
  getNextMinuteSelection,
  initialEditorSelection,
} from '../utils/editorTime';
import {to24Hour} from '../utils/time';
import {ImageEditorScreen} from './alarm/ImageEditorScreen';

export function AlarmEditorScreen() {
  const route = useRoute();
  const alarm = route.params?.alarm ?? null;
  const session = alarm && alarm.id ? alarm.id : 'new';
  return <AlarmEditorForm key={session} alarm={alarm} />;
}

function AlarmEditorForm({alarm}) {
  const navigation = useNavigation();
  const {reload} = useAlarms();
  const {colors, scheme, typography, radius} = useTheme();
  const insets = useSafeAreaInsets();
  const initial = useMemo(() => {
    if (alarm) {
      return initialEditorSelection(alarm.hour, alarm.minute);
    }
    return getNextMinuteSelection();
  }, [alarm]);
  const [hour12, setHour12] = useState(initial.hour12);
  const [minute, setMinute] = useState(initial.minute);
  const [period, setPeriod] = useState(initial.period);
  const [label, setLabel] = useState(alarm ? alarm.label : 'Vision Grind & Mindset');
  const [vibrate, setVibrate] = useState(alarm ? alarm.vibrate !== false : true);
  const [difficulty, setDifficulty] = useState(alarm?.difficulty || 'easy');
  const [repeatDays, setRepeatDays] = useState(alarm?.repeatDays || []);
  const [selectedSoundId, setSelectedSoundId] = useState(
    alarm?.alarmSoundId || alarm?.sound || DEFAULT_ALARM_SOUND_ID,
  );
  const [soundModalVisible, setSoundModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pickingTime, setPickingTime] = useState(false);
  const [error, setError] = useState('');

  // Per-alarm puzzle image draft state
  const initialImage = useMemo(() => {
    const rawId = alarm?.puzzleImageId || DEFAULT_PUZZLE_IMAGE_ID;
    const rawType = alarm?.puzzleImageType || DEFAULT_PUZZLE_IMAGE_TYPE;
    return resolveImageSource(rawId, rawType);
  }, [alarm?.puzzleImageId, alarm?.puzzleImageType]);

  const [puzzleImage, setPuzzleImage] = useState(initialImage);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [cropVisible, setCropVisible] = useState(false);
  const [pendingCropImage, setPendingCropImage] = useState(null);
  const [imageActionLoading, setImageActionLoading] = useState(false);

  const {
    recentImages,
    recordRecent,
    resolveAlarmImage,
  } = usePuzzleImageLibrary();

  // If this alarm has a custom image, resolve its file URI from native repository
  useEffect(() => {
    let active = true;
    if (alarm?.puzzleImageType === 'custom' && alarm?.puzzleImageId) {
      resolveAlarmImage(alarm.puzzleImageId, 'custom').then(resolved => {
        if (active && resolved && resolved.source) {
          setPuzzleImage(resolved);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [alarm?.puzzleImageId, alarm?.puzzleImageType, resolveAlarmImage]);

  // Clean up any preview audio when the screen is dismissed or unmounted
  useEffect(() => {
    return () => {
      stopAudioPreview().catch(() => {});
    };
  }, []);

  const busy = saving || deleting || pickingTime || imageActionLoading;
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

  const handleSelectBundledImage = useCallback(
    async id => {
      const resolved = resolveImageSource(id, 'bundled');
      setPuzzleImage(resolved);
      setGalleryVisible(false);
      await recordRecent(resolved);
    },
    [recordRecent],
  );

  const handleSelectRecentImage = useCallback(
    async selected => {
      setPuzzleImage(selected);
      setGalleryVisible(false);
      await recordRecent(selected);
    },
    [recordRecent],
  );

  const handleChooseFromPhone = useCallback(async () => {
    setImageActionLoading(true);
    setError('');
    try {
      const picked = await pickImageFromPhone();
      setImageActionLoading(false);
      if (picked && !picked.cancelled && picked.uri) {
        setGalleryVisible(false);
        setPendingCropImage(picked);
        setCropVisible(true);
      }
    } catch (pickErr) {
      setImageActionLoading(false);
      setError(pickErr?.message || 'Photo selection failed.');
    }
  }, []);

  const handleEditCurrentArtwork = useCallback(() => {
    if (puzzleImage?.uri || puzzleImage?.source?.uri) {
      setPendingCropImage({
        uri: puzzleImage.uri || puzzleImage.source?.uri,
        title: puzzleImage.title || 'Custom Photo',
        width: puzzleImage.width,
        height: puzzleImage.height,
      });
      setCropVisible(true);
    } else {
      setGalleryVisible(true);
    }
  }, [puzzleImage]);

  async function onSave() {
    if (busy) {
      return;
    }
    setSaving(true);
    setError('');
    await stopAudioPreview().catch(() => {});
    try {
      const saved = await saveAlarm(
        buildSavePayload({
          alarm,
          hour12,
          minute,
          period,
          label,
          vibrate,
          editing,
          puzzleImageId: puzzleImage.id,
          puzzleImageType: puzzleImage.type,
          difficulty,
          repeatDays,
          sound: selectedSoundId,
          alarmSoundId: selectedSoundId,
        }),
      );
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          buildAlarmSaveToast(saved, {isEditing: editing}),
          ToastAndroid.LONG,
        );
      }
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
      {/* 1. Top Navigation Header (Fixed at top) */}
      <View style={[styles.headerContainer, {paddingTop: insets.top + spacing.xs}]}>
        <EditorHeader
          onCancel={() => navigation.goBack()}
          onSave={onSave}
          saveDisabled={busy}
          subtitle="B-DISCIPLINE VISION LOCK"
          title={editing ? 'Edit Alarm' : 'Add Alarm'}
        />
      </View>

      {/* Form Content Area */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {paddingBottom: insets.bottom + spacing.xl},
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* 2. Alarm Time & Label Card */}
        <EditorTimeCard
          disabled={busy}
          hour12={hour12}
          label={label}
          minute={minute}
          onLabelChange={setLabel}
          onPressTime={openTimePicker}
          period={period}
        />

        {/* 3. Repeat Routine Card */}
        <RepeatRoutineCard
          disabled={busy}
          onChange={setRepeatDays}
          selectedDays={repeatDays}
        />

        {/* 4. Wake-Up Vision Mission & Difficulty Card */}
        <WakeUpVisionMissionCard
          currentImage={puzzleImage}
          difficulty={difficulty}
          disabled={busy}
          onDifficultyChange={setDifficulty}
          onEditPress={handleEditCurrentArtwork}
          onReplacePress={() => setGalleryVisible(true)}
        />

        {/* 5. Alarm Settings Card */}
        <SurfaceCard style={[styles.settings, {borderRadius: radius.lg}]}>
          <SettingsRow
            disabled={busy}
            icon="bell-outline"
            onPress={() => setSoundModalVisible(true)}
            showChevron
            subtitle={findAlarmSound(selectedSoundId).description || 'Alarm ringtone'}
            title="Alarm Sound"
            trailing={findAlarmSound(selectedSoundId).name}
          />
          <SettingsDivider />
          <SettingsRow
            disabled={busy}
            icon="cellphone-basic"
            onSwitchChange={setVibrate}
            subtitle="Strong pulse pattern"
            switchValue={vibrate}
            title="Haptic Vibration"
          />
          <SettingsDivider />
          <SettingsRow
            badge="STRICT"
            icon="clock-outline"
            subtitle="1 Snooze max (5 minutes penalty)"
            title="Discipline Snooze"
            trailing="5 min"
          />
        </SurfaceCard>

        {/* 6. Test Puzzle Wake-Up Screen Action */}
        <Pressable
          accessibilityHint="Previews the wake-up puzzle with the currently selected artwork and difficulty"
          accessibilityLabel="Test puzzle wake-up screen"
          accessibilityRole="button"
          disabled={busy}
          onPress={() => {
            navigation.navigate('Puzzle', {
              previewImage: puzzleImage,
              previewDifficulty: difficulty,
              isPreview: true,
            });
          }}
          style={({pressed}) => [
            styles.testButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.accent,
              borderRadius: radius.md,
            },
            pressed && styles.pressed,
            busy && styles.disabled,
          ]}>
          <AppIcon color={colors.accent} name="eye-outline" size={18} />
          <Text style={[typography.bodyStrong, styles.testButtonText, {color: colors.accent}]}>
            TEST PUZZLE WAKE-UP SCREEN
          </Text>
        </Pressable>

        {error ? (
          <Text style={[styles.error, {color: colors.error}]}>{error}</Text>
        ) : null}

        {/* 7. Delete Alarm Action (Edit mode only) */}
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

      {/* Sound Selection Modal */}
      <SoundSelectionModal
        onClose={() => setSoundModalVisible(false)}
        onSelectSound={id => setSelectedSoundId(id)}
        selectedSoundId={selectedSoundId}
        visible={soundModalVisible}
      />

      {/* Image Gallery Selection Modal */}
      <ImageGalleryModal
        currentImageId={puzzleImage.id}
        loading={imageActionLoading}
        onChooseFromPhone={handleChooseFromPhone}
        onClose={() => setGalleryVisible(false)}
        onSelectBundled={handleSelectBundledImage}
        onSelectRecent={handleSelectRecentImage}
        recentImages={recentImages}
        visible={galleryVisible}
      />

      {/* Dedicated Pinch-to-Zoom Square Image Editor */}
      <Modal
        animationType="slide"
        onRequestClose={() => {
          setCropVisible(false);
          setPendingCropImage(null);
        }}
        statusBarTranslucent
        visible={cropVisible && Boolean(pendingCropImage)}>
        {pendingCropImage ? (
          <ImageEditorScreen
            image={pendingCropImage}
            onApply={async croppedImage => {
              setPuzzleImage(croppedImage);
              setCropVisible(false);
              setPendingCropImage(null);
              await recordRecent(croppedImage);
            }}
            onCancel={() => {
              setCropVisible(false);
              setPendingCropImage(null);
            }}
          />
        ) : null}
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: spacing.md,
  },
  headerContainer: {
    paddingBottom: spacing.xs,
    zIndex: 10,
  },
  content: {
    flexGrow: 1,
    paddingTop: spacing.xs,
  },
  settings: {
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  testButton: {
    alignItems: 'center',
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  testButtonText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  deleteHit: {
    alignItems: 'center',
    marginTop: spacing.lg,
    minHeight: 44,
    justifyContent: 'center',
  },
  delete: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
});
