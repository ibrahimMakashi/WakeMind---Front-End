import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';
import {WEEKDAY_CONFIG} from '../utils/repeatDays';
import {formatListTimeParts} from '../utils/time';
import {AlarmSwitch} from './AlarmSwitch';
import {AppIcon} from './AppIcon';
import {SurfaceCard} from './SurfaceCard';

export function getPuzzleBadgeConfig(alarm) {
  if (alarm.difficulty === 'gentle' || alarm.puzzleDisabled) {
    return {
      icon: 'sprout-outline',
      label: 'Gentle Wake Only',
    };
  }
  if (alarm.difficulty === 'medium' || alarm.difficulty === 'challenging') {
    return {
      icon: 'brain',
      label: '4×4 Hardcore Challenge',
    };
  }
  if (alarm.difficulty === 'hard') {
    return {
      icon: 'brain',
      label: '5×5 Mind Matrix Challenge',
    };
  }
  return {
    icon: 'grid',
    label: 'Vision 3×3 Puzzle',
  };
}

export function AlarmCard({alarm, onToggle, onEdit, toggling}) {
  const {colors, typography} = useTheme();
  const parts = formatListTimeParts(alarm.hour, alarm.minute);
  const enabled = Boolean(alarm.enabled);
  const badgeConfig = getPuzzleBadgeConfig(alarm);
  const repeatDays = Array.isArray(alarm.repeatDays) ? alarm.repeatDays : [];

  function openEditor() {
    if (toggling) {
      return;
    }
    onEdit();
  }

  const timeColor = enabled ? (colors.text || '#FFFFFF') : (colors.disabled || '#5A6882');
  const periodColor = enabled ? colors.accent : '#475569';
  const labelColor = enabled ? (colors.textSoft || '#E2E8F0') : (colors.disabled || '#5A6882');

  return (
    <SurfaceCard accentTop={enabled} subdued={!enabled} style={styles.card}>
      <View collapsable={false} style={styles.topRow}>
        <Pressable
          accessibilityLabel={`Edit ${alarm.label}, ${parts.timeText} ${parts.period}`}
          accessibilityRole="button"
          accessibilityState={{disabled: Boolean(toggling)}}
          disabled={Boolean(toggling)}
          onPress={openEditor}
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
            enabled ? `Turn ${alarm.label} off` : `Turn ${alarm.label} on`
          }
          disabled={Boolean(toggling)}
          onValueChange={onToggle}
          value={enabled}
        />
      </View>

      <Pressable
        accessibilityState={{disabled: Boolean(toggling)}}
        collapsable={false}
        disabled={Boolean(toggling)}
        onPress={openEditor}>
        <Text style={[typography.bodyStrong, styles.label, {color: labelColor}]}>
          {alarm.label}
        </Text>

        {/* Puzzle / Mission Badge */}
        <View
          style={[
            styles.badge,
            {
              backgroundColor: enabled
                ? (colors.badgeActiveBg || 'rgba(255, 184, 77, 0.08)')
                : (colors.badgeInactiveBg || '#131924'),
              borderColor: enabled
                ? (colors.badgeActiveBorder || 'rgba(255, 184, 77, 0.35)')
                : (colors.badgeInactiveBorder || '#1C2534'),
            },
          ]}>
          <AppIcon
            name={badgeConfig.icon}
            color={enabled ? colors.accent : (colors.disabled || '#5A6882')}
            size={13}
          />
          <Text
            style={[
              styles.badgeText,
              {color: enabled ? colors.accent : (colors.disabled || '#5A6882')},
            ]}>
            {badgeConfig.label}
          </Text>
        </View>

        {/* Inner Weekday Inset Container */}
        <View
          style={[
            styles.insetContainer,
            {
              backgroundColor: enabled
                ? (colors.cardInner || '#0A101C')
                : (colors.cardInnerInactive || '#070B14'),
              borderColor: enabled
                ? (colors.cardInnerBorder || '#1A2436')
                : (colors.cardInnerBorderInactive || '#121824'),
            },
          ]}>
          <View style={styles.weekdaysRow}>
            {WEEKDAY_CONFIG.map(day => {
              const isSelected = repeatDays.includes(day.id);
              return (
                <View
                  key={day.id}
                  style={[
                    styles.dayBox,
                    enabled
                      ? isSelected
                        ? [styles.dayBoxSelected, {backgroundColor: colors.weekdaySelected || colors.accent}]
                        : styles.dayBoxUnselected
                      : isSelected
                      ? [styles.dayBoxDisabledSelected, {backgroundColor: colors.weekdayInactiveSelected || '#1A2332'}]
                      : styles.dayBoxDisabledUnselected,
                  ]}>
                  <Text
                    style={[
                      styles.dayLabel,
                      enabled
                        ? isSelected
                          ? styles.dayLabelActiveSelected
                          : styles.dayLabelActiveUnselected
                        : isSelected
                        ? styles.dayLabelInactiveSelected
                        : styles.dayLabelInactiveUnselected,
                    ]}>
                    {day.label}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.soundIndicator}>
            {enabled ? (
              <View style={styles.soundRow}>
                <AppIcon name="volume-high" color={colors.accent} size={15} />
                <Text style={[styles.soundText, {color: colors.textSoft || '#E2E8F0'}]}>
                  Loud
                </Text>
              </View>
            ) : (
              <Text style={[styles.inactiveText, {color: colors.disabled || '#475569'}]}>
                Inactive
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 16,
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timePress: {
    flex: 1,
    minHeight: 40,
  },
  timeRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  period: {
    marginBottom: 4,
    marginLeft: 6,
  },
  label: {
    marginTop: 4,
  },
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  insetContainer: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  weekdaysRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  dayBox: {
    alignItems: 'center',
    borderRadius: 6,
    height: 26,
    justifyContent: 'center',
    marginRight: 4,
    width: 26,
  },
  dayBoxSelected: {},
  dayBoxUnselected: {
    backgroundColor: 'transparent',
  },
  dayBoxDisabledSelected: {},
  dayBoxDisabledUnselected: {
    backgroundColor: 'transparent',
  },
  dayLabel: {
    fontSize: 11,
  },
  dayLabelActiveSelected: {
    color: '#070C16',
    fontWeight: '800',
  },
  dayLabelActiveUnselected: {
    color: '#344054',
    fontWeight: '700',
  },
  dayLabelInactiveSelected: {
    color: '#5A6882',
    fontWeight: '800',
  },
  dayLabelInactiveUnselected: {
    color: '#232C3C',
    fontWeight: '700',
  },
  soundIndicator: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  soundRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  soundText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
  inactiveText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
