import {Pressable, StyleSheet, Text, View} from 'react-native';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';

export function EditorHeader({title, subtitle, onCancel, onSave, saveDisabled}) {
  const {colors, typography, radius} = useTheme();
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cancel"
        disabled={saveDisabled}
        onPress={onCancel}
        style={styles.side}>
        <Text style={[typography.bodyStrong, {color: colors.textSoft}]}>Cancel</Text>
      </Pressable>
      <View style={styles.center}>
        <Text style={[typography.screenTitle, {color: colors.text}]}>{title}</Text>
        {subtitle ? (
          <Text style={[typography.brandSubtitle, styles.sub, {color: colors.accent}]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Save alarm"
        accessibilityState={{disabled: saveDisabled}}
        disabled={saveDisabled}
        onPress={onSave}
        style={[
          styles.save,
          {backgroundColor: colors.accent, borderRadius: radius.pill},
          saveDisabled && styles.dimmed,
        ]}>
        <Text style={[typography.button, {color: colors.accentText}]}>Save</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 52,
    paddingVertical: spacing.sm,
  },
  side: {
    minHeight: 44,
    minWidth: 72,
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    flex: 1,
  },
  sub: {
    fontSize: 9,
    marginTop: 2,
  },
  save: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 72,
    paddingHorizontal: spacing.md,
  },
  dimmed: {
    opacity: 0.45,
  },
});
