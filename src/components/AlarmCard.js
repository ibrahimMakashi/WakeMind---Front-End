import {Pressable, StyleSheet, Switch, Text, View} from 'react-native';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';
import {formatListTimeParts} from '../utils/time';
import {StatusBadge} from './StatusBadge';
import {SurfaceCard} from './SurfaceCard';

export function AlarmCard({alarm, onToggle, onEdit, toggling}) {
  const {colors, typography} = useTheme();
  const parts = formatListTimeParts(alarm.hour, alarm.minute);
  const enabled = alarm.enabled;
  const timeColor = enabled ? colors.text : colors.textSoft;
  const periodColor = enabled ? colors.accent : colors.textSoft;

  function openEditor() {
    if (toggling) {
      return;
    }
    onEdit();
  }

  return (
    <SurfaceCard accentTop={enabled} subdued={!enabled} style={styles.card}>
      <View collapsable={false} style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${alarm.label}, ${parts.timeText} ${parts.period}`}
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
        <Switch
          accessibilityLabel={
            enabled ? `Turn ${alarm.label} off` : `Turn ${alarm.label} on`
          }
          disabled={toggling}
          onValueChange={onToggle}
          thumbColor={colors.switchThumb}
          trackColor={{false: colors.switchOff, true: colors.accent}}
          value={enabled}
        />
      </View>
      <Pressable
        accessibilityState={{disabled: Boolean(toggling)}}
        collapsable={false}
        disabled={Boolean(toggling)}
        onPress={openEditor}>
        <Text style={[typography.bodyStrong, styles.label, {color: timeColor}]}>
          {alarm.label}
        </Text>
        <View collapsable={false} style={styles.metaRow}>
          <StatusBadge
            icon={alarm.vibrate !== false ? 'vibrate' : 'volume-off'}
            label={alarm.vibrate !== false ? 'Vibration' : 'Silent'}
            muted={!enabled}
          />
          <Text style={[typography.caption, {color: colors.textSoft}]}>
            {enabled ? '' : 'Inactive'}
          </Text>
        </View>
      </Pressable>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timePress: {
    flex: 1,
    minHeight: 44,
  },
  timeRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  period: {
    marginBottom: 6,
    marginLeft: spacing.sm,
  },
  label: {
    marginTop: spacing.xs,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
