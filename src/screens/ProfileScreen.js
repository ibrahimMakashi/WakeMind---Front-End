import {useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppIcon} from '../components/AppIcon';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';

const OPTIONS = [
  {
    mode: 'system',
    label: 'System',
    detail: 'Automatic. Follows the device appearance.',
    icon: 'theme-light-dark',
  },
  {
    mode: 'light',
    label: 'Light',
    detail: 'Warm off-white and muted indigo.',
    icon: 'white-balance-sunny',
  },
  {
    mode: 'dark',
    label: 'Dark',
    detail: 'Deep charcoal and soft lavender.',
    icon: 'weather-night',
  },
];

export function ProfileScreen() {
  const {colors, mode, setThemeMode} = useTheme();
  const insets = useSafeAreaInsets();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {paddingTop: insets.top + spacing.lg, paddingBottom: spacing.xl},
      ]}
      style={[styles.screen, {backgroundColor: colors.background}]}>
      <Text style={[styles.kicker, {color: colors.accent}]}>WakeMind</Text>
      <Text style={[styles.title, {color: colors.text}]}>Profile</Text>
      <Text style={[styles.intro, {color: colors.muted}]}>
        Appearance is saved on this device.
      </Text>
      <Text style={[styles.section, {color: colors.muted}]}>Appearance</Text>
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
                  backgroundColor: colors.surface,
                  borderColor: selected ? colors.accent : colors.line,
                },
                pressed && !saving && styles.pressed,
              ]}>
              <AppIcon
                name={option.icon}
                color={selected ? colors.accent : colors.muted}
              />
              <View style={styles.copy}>
                <Text style={[styles.optionLabel, {color: colors.text}]}>
                  {option.label}
                </Text>
                <Text style={[styles.optionDetail, {color: colors.muted}]}>
                  {option.detail}
                </Text>
              </View>
              {selected ? (
                <AppIcon name="check" color={colors.accent} size={22} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text style={[styles.error, {color: colors.error}]}>{error}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
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
  intro: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  section: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: spacing.md,
    marginTop: spacing.xl,
    textTransform: 'uppercase',
  },
  option: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    minHeight: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.82,
  },
  copy: {
    flex: 1,
    marginLeft: spacing.md,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '700',
  },
  optionDetail: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  error: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: spacing.md,
  },
});
