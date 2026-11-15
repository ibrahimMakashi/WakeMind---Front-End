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

  const timeColor = enabled ? colors.text : colors.disabled || '#5A6882';
  const periodColor = enabled ? colors.accent : '#475569';
  const labelColor = enabled ? colors.textSoft || '#E2E8F0' : colors.disabled || '#5A6882';

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
            enabled
              ? {
                  backgroundColor: 'rgba(255, 184, 77, 0.08)',
                  borderColor: 'rgba(255, 184, 77, 0.35)',
                }
              : {
                  backgroundColor: '#151B27',
                  borderColor: '#202838',
                },
          ]}>
          <AppIcon
            name={badgeConfig.icon}
            color={enabled ? colors.accent : colors.disabled || '#5A6882'}
            size={13}
          />
          <Text
            style={[
              styles.badgeText,
              {color: enabled ? colors.accent : colors.disabled || '#5A6882'},
            ]}>
            {badgeConfig.label}
          </Text>
        </View>

        {/* Weekday Selector Row & Sound Indicator */}
        <View style={styles.bottomRow}>
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
                        ? [styles.dayBoxSelected, {backgroundColor: colors.accent}]
                        : styles.dayBoxUnselected
                      : isSelected
                      ? styles.dayBoxDisabledSelected
                      : styles.dayBoxDisabledUnselected,
                  ]}>
                  <Text
                    style={[
                      styles.dayLabel,
                      enabled
                        ? isSelected
                          ? {color: colors.accentText || '#070C16', fontWeight: '800'}
                          : {color: '#344054', fontWeight: '700'}
                        : isSelected
                        ? {color: '#64748B', fontWeight: '800'}
                        : {color: '#232C3C', fontWeight: '700'},
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
                <AppIcon name="volume-high" color={colors.accent} size={16} />
                <Text style={[styles.soundText, {color: colors.textSoft || '#E2E8F0'}]}>
                  100%
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
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
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
  dayBoxDisabledSelected: {
    backgroundColor: '#1E2738',
  },
  dayBoxDisabledUnselected: {
    backgroundColor: 'transparent',
  },
  dayLabel: {
    fontSize: 11,
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
    marginLeft: 4,
  },
  inactiveText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
