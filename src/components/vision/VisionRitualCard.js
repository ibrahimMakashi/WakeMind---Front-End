import {Pressable, StyleSheet, Text, View} from 'react-native';
import {spacing} from '../../constants/theme';
import {useTheme} from '../../theme/ThemeProvider';
import {formatListTimeParts} from '../../utils/time';
import {AlarmSwitch} from '../AlarmSwitch';
import {AppIcon} from '../AppIcon';
import {SurfaceCard} from '../SurfaceCard';

export function VisionRitualCard({ritual, onToggle, onEdit, toggling}) {
  const {colors, typography, radius} = useTheme();
  const parts = formatListTimeParts(ritual.hour, ritual.minute);
  const enabled = Boolean(ritual.enabled);

  const timeColor = enabled ? (colors.text || '#FFFFFF') : (colors.disabled || '#5A6882');
  const periodColor = enabled ? (colors.accent || '#F59E0B') : '#475569';
  const previewColor = enabled ? (colors.textSoft || '#E2E8F0') : (colors.disabled || '#5A6882');

  return (
    <SurfaceCard accentTop={enabled} subdued={!enabled} style={styles.card}>
      <View collapsable={false} style={styles.topRow}>
        <Pressable
          accessibilityLabel={`Edit Vision Ritual, ${parts.timeText} ${parts.period}`}
          accessibilityRole="button"
          accessibilityState={{disabled: Boolean(toggling)}}
          disabled={Boolean(toggling)}
          onPress={onEdit}
          style={styles.timePress}>
          <View style={styles.timeRow}>
            <Text style={[typography.listTime, {color: timeColor}]}>
              {parts.timeText}
            </Text>
            <Text style={[typography.listPeriod, styles.period, {color: periodColor}]}>
              {parts.period}
            </Text>
          </View>
        </Pressable>

        <AlarmSwitch
          accessibilityLabel={
            enabled ? 'Turn Vision Ritual off' : 'Turn Vision Ritual on'
          }
          disabled={Boolean(toggling)}
          onValueChange={onToggle}
          value={enabled}
        />
      </View>

      {/* Recitation Count Badge */}
      <View style={styles.badgeRow}>
        <View
          style={[
            styles.badge,
            enabled ? styles.badgeActive : styles.badgeInactive,
            {
              backgroundColor: enabled ? colors.surfaceDeep : 'transparent',
              borderColor: enabled ? colors.accent : colors.borderSubtle,
              borderRadius: radius?.sm || 6,
            },
          ]}>
          <AppIcon
            color={enabled ? (colors.accent || '#F59E0B') : (colors.disabled || '#5A6882')}
            name="repeat"
            size={13}
          />
          <Text
            style={[
              typography.caption,
              styles.badgeText,
              {color: enabled ? (colors.accent || '#F59E0B') : (colors.disabled || '#5A6882')},
            ]}>
            {ritual.repetitionTarget || 10}× Recitation
          </Text>
        </View>
      </View>

      {/* Vision Text Preview */}
      <Pressable
        accessibilityLabel="Edit Vision Ritual affirmation text"
        accessibilityRole="button"
        disabled={Boolean(toggling)}
        onPress={onEdit}
        style={styles.textPress}>
        <Text
          numberOfLines={2}
          style={[typography.body, styles.previewText, {color: previewColor}]}>
          {ritual.ritualText || 'No affirmation text configured'}
        </Text>
      </Pressable>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timePress: {
    flex: 1,
  },
  timeRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 6,
  },
  period: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  badge: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeActive: {},
  badgeInactive: {},
  badgeText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textPress: {
    marginTop: spacing.sm,
  },
  previewText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
