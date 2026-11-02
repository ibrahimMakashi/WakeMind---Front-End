import {Pressable, StyleSheet, Text, View} from 'react-native';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';

export function EditorHeader({title, subtitle, onCancel, onSave, saveDisabled}) {
  const {colors, typography, radius} = useTheme();
  return (
    <View style={styles.header}>
      <View style={styles.sideLeft}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          disabled={saveDisabled}
          onPress={onCancel}
          style={({pressed}) => [styles.cancelHit, pressed && styles.pressed]}>
          <Text style={[typography.bodyStrong, {color: colors.textSoft}]}>Cancel</Text>
        </Pressable>
      </View>

      <View style={styles.center}>
        <Text numberOfLines={1} style={[typography.screenTitle, styles.titleText, {color: colors.text}]}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={[typography.brandSubtitle, styles.sub, {color: colors.accent}]}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.sideRight}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save alarm"
          accessibilityState={{disabled: saveDisabled}}
          disabled={saveDisabled}
          onPress={onSave}
          style={({pressed}) => [
            styles.save,
            {backgroundColor: colors.accent, borderRadius: radius.pill},
            saveDisabled && styles.dimmed,
            pressed && !saveDisabled && styles.pressed,
          ]}>
          <Text style={[typography.button, styles.saveText, {color: colors.accentText}]}>
            Save
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingVertical: spacing.xs,
  },
  sideLeft: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    minWidth: 72,
  },
  sideRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 72,
  },
  cancelHit: {
    justifyContent: 'center',
    minHeight: 40,
    paddingVertical: spacing.xs,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  titleText: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sub: {
    fontSize: 9,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  save: {
    alignItems: 'center',
    elevation: 2,
    justifyContent: 'center',
    minHeight: 34,
    minWidth: 68,
    paddingHorizontal: spacing.md,
  },
  saveText: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  dimmed: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.8,
  },
});
