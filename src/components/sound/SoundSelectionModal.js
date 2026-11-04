import React, {useCallback, useEffect, useState} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppIcon} from '../AppIcon';
import {ALARM_SOUNDS} from '../../constants/alarmSounds';
import {spacing} from '../../constants/theme';
import {useTheme} from '../../theme/ThemeProvider';
import {playAudioPreview, stopAudioPreview} from '../../services/alarmService';

export function SoundSelectionModal({
  visible,
  selectedSoundId,
  onSelectSound,
  onClose,
}) {
  const insets = useSafeAreaInsets();
  const {colors, typography, radius} = useTheme();
  const [previewingId, setPreviewingId] = useState(null);

  // Stop preview whenever modal closes or unmounts
  const handleStopAll = useCallback(async () => {
    try {
      await stopAudioPreview();
    } catch (_err) {}
    setPreviewingId(null);
  }, []);

  useEffect(() => {
    if (!visible) {
      handleStopAll();
    }
    return () => {
      handleStopAll();
    };
  }, [handleStopAll, visible]);

  const handleTogglePreview = async tune => {
    if (previewingId === tune.id) {
      // Pause/Stop current preview
      await handleStopAll();
    } else {
      // Stop any existing preview and play this tune
      try {
        await stopAudioPreview();
        setPreviewingId(tune.id);
        await playAudioPreview(tune.id);
      } catch (_err) {
        setPreviewingId(null);
      }
    }
  };

  const handleSelectTune = async tune => {
    await handleStopAll();
    onSelectSound(tune.id);
    onClose();
  };

  const handleClose = async () => {
    await handleStopAll();
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      hardwareAccelerated
      onRequestClose={handleClose}
      transparent
      visible={visible}>
      <View style={[styles.backdrop, {backgroundColor: 'rgba(5, 8, 16, 0.75)'}]}>
        <Pressable
          accessibilityLabel="Dismiss sound picker backdrop"
          onPress={handleClose}
          style={styles.dismissBackdrop}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 16) + spacing.md,
            },
          ]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[typography.bodyStrong, styles.title, {color: colors.text}]}>
                Alarm Sound
              </Text>
              <Text style={[typography.caption, styles.subtitle, {color: colors.textSoft}]}>
                Choose a wake-up tune for this alarm
              </Text>
            </View>

            <Pressable
              accessibilityLabel="Close sound selector"
              accessibilityRole="button"
              onPress={handleClose}
              style={({pressed}) => [
                styles.closeButton,
                {
                  backgroundColor: colors.surfaceDeep,
                  borderColor: colors.border,
                  borderRadius: radius.pill,
                },
                pressed && styles.pressed,
              ]}>
              <AppIcon color={colors.text} name="close" size={18} />
            </Pressable>
          </View>

          {/* Tunes List */}
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}>
            {ALARM_SOUNDS.map(tune => {
              const isSelected = selectedSoundId === tune.id;
              const isPlaying = previewingId === tune.id;

              return (
                <View
                  key={tune.id}
                  style={[
                    styles.tuneCard,
                    {
                      backgroundColor: colors.surfaceDeep,
                      borderColor: isSelected ? colors.accent : colors.border,
                      borderRadius: radius.md,
                    },
                  ]}>
                  {/* Left: Info */}
                  <Pressable
                    accessibilityLabel={`Select tune ${tune.name}`}
                    accessibilityRole="button"
                    onPress={() => handleSelectTune(tune)}
                    style={styles.tuneDetails}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          typography.bodyStrong,
                          styles.tuneName,
                          {color: isSelected ? colors.accent : colors.text},
                        ]}>
                        {tune.name}
                      </Text>
                      {tune.duration ? (
                        <Text style={[typography.caption, styles.duration, {color: colors.muted}]}>
                          {tune.duration}
                        </Text>
                      ) : null}
                    </View>
                    <Text
                      numberOfLines={2}
                      style={[typography.caption, styles.tuneDesc, {color: colors.textSoft}]}>
                      {tune.description}
                    </Text>
                  </Pressable>

                  {/* Right: Actions */}
                  <View style={styles.actions}>
                    {/* Play / Pause Preview Button */}
                    <Pressable
                      accessibilityLabel={
                        isPlaying
                          ? `Pause preview for ${tune.name}`
                          : `Play preview for ${tune.name}`
                      }
                      accessibilityRole="button"
                      onPress={() => handleTogglePreview(tune)}
                      style={({pressed}) => [
                        styles.previewButton,
                        {
                          backgroundColor: isPlaying
                            ? colors.accent
                            : 'rgba(255, 184, 77, 0.12)',
                          borderColor: colors.accent,
                          borderRadius: radius.pill,
                        },
                        pressed && styles.pressed,
                      ]}>
                      <AppIcon
                        color={isPlaying ? colors.accentText : colors.accent}
                        name={isPlaying ? 'pause' : 'play'}
                        size={16}
                      />
                      <Text
                        style={[
                          typography.caption,
                          styles.previewButtonText,
                          {color: isPlaying ? colors.accentText : colors.accent},
                        ]}>
                        {isPlaying ? 'Stop' : 'Preview'}
                      </Text>
                    </Pressable>

                    {/* Select / Selected Indicator */}
                    <Pressable
                      accessibilityLabel={
                        isSelected ? `${tune.name} is selected` : `Select ${tune.name}`
                      }
                      accessibilityRole="button"
                      onPress={() => handleSelectTune(tune)}
                      style={({pressed}) => [
                        styles.selectButton,
                        {
                          backgroundColor: isSelected ? colors.accent : 'transparent',
                          borderColor: isSelected ? colors.accent : colors.border,
                          borderRadius: radius.pill,
                        },
                        pressed && styles.pressed,
                      ]}>
                      {isSelected ? (
                        <View style={styles.selectedRow}>
                          <AppIcon color={colors.accentText} name="check" size={14} />
                          <Text
                            style={[
                              typography.caption,
                              styles.selectButtonText,
                              {color: colors.accentText, fontWeight: '700'},
                            ]}>
                            Selected
                          </Text>
                        </View>
                      ) : (
                        <Text
                          style={[
                            typography.caption,
                            styles.selectButtonText,
                            {color: colors.textSoft},
                          ]}>
                          Select
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dismissBackdrop: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '80%',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    alignItems: 'center',
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  tuneCard: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  tuneDetails: {
    flex: 1,
    marginRight: spacing.sm,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  tuneName: {
    fontSize: 15,
    fontWeight: '700',
  },
  duration: {
    fontSize: 11,
  },
  tuneDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  previewButton: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    minHeight: 34,
    paddingHorizontal: spacing.sm,
  },
  previewButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  selectButton: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 34,
    minWidth: 70,
    paddingHorizontal: spacing.sm,
  },
  selectButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  selectedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  pressed: {
    opacity: 0.8,
  },
});
