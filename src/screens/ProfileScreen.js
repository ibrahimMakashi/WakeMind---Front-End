import {useCallback, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAlarms} from '../alarms/AlarmsProvider';
import {AppIcon} from '../components/AppIcon';
import {BrandHeader} from '../components/BrandHeader';
import {CapabilityNotices} from '../components/CapabilityNotices';
import {PrimaryButton} from '../components/PrimaryButton';
import {ScreenContainer} from '../components/ScreenContainer';
import {SurfaceCard} from '../components/SurfaceCard';
import {TEST_ALARM_OFFSET_SECONDS} from '../constants/alarm';
import {spacing} from '../constants/theme';
import {scheduleTestAlarm} from '../services/alarmService';
import {useTheme} from '../theme/ThemeProvider';
import {formatClock} from '../utils/time';

const OPTIONS = [
  {
    mode: 'system',
    label: 'System',
    detail: 'Follows the device appearance.',
    icon: 'theme-light-dark',
  },
  {
    mode: 'light',
    label: 'Light',
    detail: 'Soft navy-tinted surfaces with amber accents.',
    icon: 'white-balance-sunny',
  },
  {
    mode: 'dark',
    label: 'Dark',
    detail: 'Midnight navy with amber mission controls.',
    icon: 'weather-night',
  },
];

export function ProfileScreen() {
  const {colors, mode, setThemeMode, typography} = useTheme();
  const insets = useSafeAreaInsets();
  const {capability, loadError, busy, reload, run} = useAlarms();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      reload().catch(refreshError => {
        setError(refreshError.message || 'Alarms could not be loaded.');
      });
    }, [reload]),
  );

  async function onSelect(nextMode) {
    if (saving || nextMode === mode) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      await setThemeMode(nextMode);
    } catch (saveError) {
      setError(saveError.message || 'The appearance could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function runTestAlarm() {
    setError('');
    setMessage('');
    try {
      const result = await run(async () => {
        const saved = await scheduleTestAlarm(TEST_ALARM_OFFSET_SECONDS);
        const clock = formatClock(saved.hour, saved.minute);
        return `Test alarm set for ${clock.hourText}:${clock.minuteText} ${clock.period}. You can leave the app.`;
      });
      if (typeof result === 'string') {
        setMessage(result);
      }
    } catch (actionError) {
      setError(actionError.message || 'Something went wrong.');
    }
  }

  return (
    <ScreenContainer style={styles.screen} edges={[]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl},
        ]}
        showsVerticalScrollIndicator={false}>
        <BrandHeader subtitle="PROFILE" />
        <Text style={[typography.sectionLabel, styles.section, {color: colors.muted}]}>
          APPEARANCE
        </Text>
        <View accessibilityRole="radiogroup">
          {OPTIONS.map(option => {
            const selected = mode === option.mode;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{selected, disabled: saving}}
                disabled={saving}
                key={option.mode}
                onPress={() => onSelect(option.mode)}
                style={({pressed}) => [
                  styles.option,
                  {
                    backgroundColor: colors.surfaceRaised,
                    borderColor: selected ? colors.accent : colors.border,
                  },
                  pressed && !saving && styles.pressed,
                ]}>
                <AppIcon
                  name={option.icon}
                  color={selected ? colors.accent : colors.muted}
                />
                <View style={styles.copy}>
                  <Text style={[typography.bodyStrong, {color: colors.text}]}>
                    {option.label}
                  </Text>
                  <Text style={[typography.caption, {color: colors.muted}]}>
                    {option.detail}
                  </Text>
                </View>
                {selected ? <AppIcon name="check" color={colors.accent} size={22} /> : null}
              </Pressable>
            );
          })}
        </View>
        <Text style={[typography.sectionLabel, styles.section, {color: colors.muted}]}>
          ALARM PERMISSIONS
        </Text>
        <SurfaceCard>
          <CapabilityNotices
            capability={capability}
            disabled={busy}
            onError={setError}
          />
        </SurfaceCard>
        <Text style={[typography.sectionLabel, styles.section, {color: colors.muted}]}>
          DEVELOPER
        </Text>
        <PrimaryButton
          disabled={busy}
          label="Test Alarm"
          onPress={runTestAlarm}
        />
        {message ? (
          <Text style={[typography.caption, styles.feedback, {color: colors.success}]}>
            {message}
          </Text>
        ) : null}
        {error || loadError ? (
          <Text style={[typography.caption, styles.feedback, {color: colors.error}]}>
            {error || loadError}
          </Text>
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
  section: {
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  option: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    minHeight: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.88,
  },
  copy: {
    flex: 1,
    marginLeft: spacing.md,
  },
  feedback: {
    lineHeight: 20,
    marginTop: spacing.sm,
  },
});
