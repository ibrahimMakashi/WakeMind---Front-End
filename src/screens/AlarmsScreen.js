import {useCallback, useMemo, useState} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAlarms} from '../alarms/AlarmsProvider';
import {AlarmCard} from '../components/AlarmCard';
import {PrimaryButton} from '../components/PrimaryButton';
import {spacing} from '../constants/theme';
import {deleteAlarm, setAlarmEnabled} from '../services/alarmService';
import {useTheme} from '../theme/ThemeProvider';
import {sortAlarms} from '../utils/time';

export function AlarmsScreen() {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const {alarms, loadError, busy, reload, run} = useAlarms();
  const [error, setError] = useState('');
  const orderedAlarms = useMemo(() => sortAlarms(alarms), [alarms]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      reload().catch(refreshError => {
        if (active) {
          setError(refreshError.message || 'Alarms could not be loaded.');
        }
      });
      return () => {
        active = false;
      };
    }, [reload]),
  );

  async function runAction(action) {
    setError('');
    try {
      await run(action);
    } catch (actionError) {
      setError(actionError.message || 'Something went wrong.');
    }
  }

  return (
    <FlatList
      data={orderedAlarms}
      extraData={busy}
      keyExtractor={alarm => alarm.id}
      style={[styles.screen, {backgroundColor: colors.background}]}
      contentContainerStyle={[
        styles.content,
        {paddingTop: insets.top + spacing.lg, paddingBottom: spacing.xl},
      ]}
      ListHeaderComponent={
        <View>
          <Text style={[styles.kicker, {color: colors.accent}]}>WakeMind</Text>
          <Text style={[styles.title, {color: colors.text}]}>Alarms</Text>
          {error || loadError ? (
            <Text style={[styles.error, {color: colors.error}]}>
              {error || loadError}
            </Text>
          ) : null}
          <View style={styles.add}>
            <PrimaryButton
              label="Add Alarm"
              disabled={busy}
              onPress={() => navigation.navigate('Editor', {alarm: null})}
            />
          </View>
        </View>
      }
      ListEmptyComponent={
        <Text style={[styles.empty, {color: colors.muted}]}>
          No alarms yet. Add one to choose a time.
        </Text>
      }
      renderItem={({item}) => (
        <AlarmCard
          alarm={item}
          disabled={busy}
          onToggle={enabled =>
            runAction(() => setAlarmEnabled(item.id, enabled))
          }
          onEdit={() => navigation.navigate('Editor', {alarm: item})}
          onDelete={() => runAction(() => deleteAlarm(item.id))}
        />
      )}
    />
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
  error: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: spacing.md,
  },
  add: {
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
  },
  empty: {
    fontSize: 16,
    lineHeight: 22,
  },
});
