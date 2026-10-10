import {Pressable, StyleSheet, Text, View} from 'react-native';
import {spacing} from '../constants/theme';
import {
  openExactAlarmSettings,
  openFullScreenIntentSettings,
} from '../services/alarmService';
import {useTheme} from '../theme/ThemeProvider';

export function CapabilityNotices({capability, disabled, onError}) {
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
          onPress={() =>
            openExactAlarmSettings().catch(settingsError => {
              onError?.(
                settingsError.message || 'Exact-alarm settings could not be opened.',
              );
            })
          }
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
          onPress={() =>
            openFullScreenIntentSettings().catch(settingsError => {
              onError?.(
                settingsError.message ||
                  'Full-screen notification settings could not be opened.',
              );
            })
          }
        />
      ) : null}
      {capability.notifications === 'denied' ? (
        <Notice text="Notifications are off. The alarm sound can still start, but the lock-screen alert may not appear until notifications are allowed." />
      ) : null}
    </View>
  );
}

function Notice({text, actionLabel, onPress, disabled}) {
  const {colors} = useTheme();
  return (
    <View style={[styles.notice, {backgroundColor: colors.surface, borderColor: colors.line}]}>
      <Text style={[styles.noticeText, {color: colors.text}]}>{text}</Text>
      {actionLabel ? (
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={onPress}
          style={styles.action}>
          <Text style={[styles.noticeAction, {color: colors.accent}]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderRadius: 14,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  noticeText: {
    fontSize: 14,
    lineHeight: 20,
  },
  action: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: 44,
  },
  noticeAction: {
    fontSize: 15,
    fontWeight: '700',
  },
});
