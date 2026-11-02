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
    <SurfaceCard style={[styles.card, {borderRadius: radius.lg}]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Alarm time ${pad2(hour12)} ${pad2(minute)} ${period}. Tap to change.`}
        accessibilityState={{disabled}}
        disabled={disabled}
        onPress={onPressTime}
        style={({pressed}) => [styles.timeRow, pressed && !disabled && styles.pressed]}>
        {/* Hours Block */}
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

        {/* Colon */}
        <View style={styles.colon}>
          <View style={[styles.dot, {backgroundColor: colors.accent}]} />
          <View style={[styles.dot, {backgroundColor: colors.accent}]} />
        </View>

        {/* Minutes Block */}
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

        {/* AM / PM Toggle Column */}
        <View style={styles.periodWrapper}>
          <View style={[styles.periodCol, {backgroundColor: colors.surfaceDeep, borderRadius: radius.md}]}>
            <View
              style={[
                styles.periodHalf,
                period === 'AM' && [styles.periodActive, {backgroundColor: colors.accent, borderRadius: radius.sm}],
              ]}>
              <Text
                style={[
                  typography.bodyStrong,
                  styles.periodText,
                  {color: period === 'AM' ? colors.accentText : colors.muted},
                ]}>
                AM
              </Text>
            </View>
            <View
              style={[
                styles.periodHalf,
                period === 'PM' && [styles.periodActive, {backgroundColor: colors.accent, borderRadius: radius.sm}],
              ]}>
              <Text
                style={[
                  typography.bodyStrong,
                  styles.periodText,
                  {color: period === 'PM' ? colors.accentText : colors.muted},
                ]}>
                PM
              </Text>
            </View>
          </View>
          {/* Spacer to align with HOURS/MINUTES labels */}
          <Text style={[typography.cardHeading, styles.fieldLabel, styles.invisibleLabel]}>
            PER
          </Text>
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
    overflow: 'hidden',
    paddingBottom: spacing.md,
    paddingTop: spacing.lg,
  },
  timeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
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
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  labelInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 44,
    paddingVertical: 0,
  },
  pressed: {
    opacity: 0.88,
  },
});
