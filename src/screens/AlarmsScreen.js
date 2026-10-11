import {useCallback, useMemo, useState} from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAlarms} from '../alarms/AlarmsProvider';
import {AlarmCard} from '../components/AlarmCard';
import {AppIcon} from '../components/AppIcon';
import {spacing} from '../constants/theme';
import {setAlarmEnabled} from '../services/alarmService';
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
    <View style={[styles.screen, {backgroundColor: colors.background}]}>
      <View style={[styles.header, {paddingTop: insets.top + spacing.sm}]}>
        <View style={styles.headerSide} />
        <Text style={[styles.title, {color: colors.text}]}>Alarms</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add alarm"
          disabled={busy}
          onPress={() => navigation.navigate('Editor', {alarm: null})}
          style={[styles.add, {backgroundColor: colors.surfaceRaised}]}>
          <AppIcon name="plus" color={colors.text} size={22} />
        </Pressable>
      </View>
      {error || loadError ? (
        <Text style={[styles.error, {color: colors.error}]}>{error || loadError}</Text>
      ) : null}
      <FlatList
        data={orderedAlarms}
        extraData={busy}
        keyExtractor={alarm => alarm.id}
        style={styles.list}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <Text style={[styles.empty, {color: colors.muted}]}>
            No alarms yet. Add one to choose a time.
          </Text>
        }
        renderItem={({item}) => (
          <AlarmCard
            alarm={item}
            disabled={busy}
            onToggle={enabled => runAction(() => setAlarmEnabled(item.id, enabled))}
            onEdit={() => navigation.navigate('Editor', {alarm: item})}
          />
        )}
      />
    </View>
  );
}

function Separator() {
  const {colors} = useTheme();
  return <View style={[styles.separator, {backgroundColor: colors.divider}]} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  headerSide: {
    width: 44,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  add: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  error: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  list: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  empty: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: spacing.lg,
  },
});
