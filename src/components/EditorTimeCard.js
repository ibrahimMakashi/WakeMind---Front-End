import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {MAX_LABEL_LENGTH} from '../constants/alarm';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';
import {AppIcon} from './AppIcon';
import {SurfaceCard} from './SurfaceCard';

function pad2(value) {
  return String(value).padStart(2, '0');
}

export function EditorTimeCard({
  hour12,
  minute,
  period,
  label,
  onLabelChange,
  onPressTime,
  disabled,
}) {
  const {colors, typography, radius} = useTheme();

  return (
    <SurfaceCard style={[styles.card, {borderRadius: radius.lg, overflow: 'hidden'}]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Alarm time ${pad2(hour12)} ${pad2(minute)} ${period}. Tap to change.`}
        accessibilityState={{disabled}}
        disabled={disabled}
        onPress={onPressTime}
        style={({pressed}) => [styles.timeRow, pressed && !disabled && styles.pressed]}>
        <View style={styles.fieldCol}>
          <View style={[styles.block, {backgroundColor: colors.surfaceDeep, borderRadius: radius.md}]}>
            <Text style={[typography.editorTimeBlock, {color: colors.text}]}>
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
            <Text style={[typography.editorTimeBlock, {color: colors.text}]}>
              {pad2(minute)}
            </Text>
          </View>
          <Text style={[typography.cardHeading, styles.fieldLabel, {color: colors.muted}]}>
            MINUTES
          </Text>
        </View>
        <View style={[styles.periodCol, {backgroundColor: colors.surfaceDeep, borderRadius: radius.md}]}>
          <View
            style={[
              styles.periodHalf,
              period === 'AM' && {backgroundColor: colors.accent, borderRadius: radius.md},
            ]}>
            <Text
              style={[
                typography.bodyStrong,
                {color: period === 'AM' ? colors.accentText : colors.muted},
              ]}>
              AM
            </Text>
          </View>
          <View
            style={[
              styles.periodHalf,
              period === 'PM' && {backgroundColor: colors.accent, borderRadius: radius.md},
            ]}>
            <Text
              style={[
                typography.bodyStrong,
                {color: period === 'PM' ? colors.accentText : colors.muted},
              ]}>
              PM
            </Text>
          </View>
        </View>
      </Pressable>
      <View style={[styles.divider, {backgroundColor: colors.border}]} />
      <View style={styles.labelRow}>
        <AppIcon name="pencil" color={colors.accent} size={18} />
        <TextInput
          accessibilityLabel="Alarm label"
          editable={!disabled}
          maxLength={MAX_LABEL_LENGTH}
          onChangeText={onLabelChange}
          placeholder="Alarm label"
          placeholderTextColor={colors.muted}
          style={[typography.bodyStrong, styles.labelInput, {color: colors.text}]}
          value={label}
        />
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingBottom: spacing.md,
  },
  timeRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  fieldCol: {
    alignItems: 'center',
  },
  block: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
    minWidth: 72,
    paddingHorizontal: spacing.sm,
  },
  fieldLabel: {
    marginTop: spacing.xs,
  },
  colon: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 28,
    marginHorizontal: spacing.sm,
  },
  dot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  periodCol: {
    marginBottom: 28,
    marginLeft: spacing.sm,
    minHeight: 72,
    overflow: 'hidden',
    width: 44,
  },
  periodHalf: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  labelInput: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 0,
  },
  pressed: {
    opacity: 0.88,
  },
});
