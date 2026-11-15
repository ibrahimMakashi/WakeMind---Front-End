import {useCallback, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAlarms} from '../alarms/AlarmsProvider';
import {AlarmCard} from '../components/AlarmCard';
import {BrandHeader} from '../components/BrandHeader';
import {FAB_BOTTOM_GAP, FAB_SIZE, FloatingAddButton} from '../components/FloatingAddButton';
import {SectionHeader} from '../components/SectionHeader';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';
import {sortAlarms} from '../utils/time';

export function AlarmsScreen() {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const {alarms, loadError, busy, reload, toggleEnabled} = useAlarms();
  const [error, setError] = useState('');
  const [pendingToggles, setPendingToggles] = useState({});
  const orderedAlarms = useMemo(() => sortAlarms(alarms), [alarms]);
  const listBottom = insets.bottom + FAB_SIZE + FAB_BOTTOM_GAP + 28;

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

  async function onToggle(id, enabled) {
    setError('');
    setPendingToggles(current => ({...current, [id]: true}));
    try {
      await toggleEnabled(id, enabled);
    } catch (actionError) {
      setError(actionError.message || 'Something went wrong.');
    } finally {
      setPendingToggles(current => {
        if (!current[id]) {
          return current;
        }
        const next = {...current};
        delete next[id];
        return next;
      });
    }
  }

  const listHeader = useMemo(
    () => (
      <View>
        <BrandHeader subtitle="ALARMS" />

        <SectionHeader
          label="SCHEDULED ALARMS"
          meta={`${orderedAlarms.length} Configured`}
          style={styles.scheduledHeader}
        />

        {error || loadError ? (
          <Text style={[styles.error, {color: colors.error}]}>{error || loadError}</Text>
        ) : null}

        {orderedAlarms.length === 0 ? (
          <Text style={[styles.empty, {color: colors.muted}]}>
            No alarms yet. Tap + to schedule your first mission.
          </Text>
        ) : null}
      </View>
    ),
    [
      colors.error,
      colors.muted,
      error,
      loadError,
      orderedAlarms.length,
    ],
  );

  return (
    <View style={[styles.screen, {backgroundColor: colors.background}]}>
      <ScrollView
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: insets.top + spacing.xs,
            paddingBottom: listBottom,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {listHeader}
        {orderedAlarms.map(alarm => (
          <AlarmCard
            key={alarm.id}
            alarm={alarm}
            onEdit={() => {
              if (pendingToggles[alarm.id]) {
                return;
              }
              navigation.navigate('Editor', {alarm});
            }}
            onToggle={enabled => onToggle(alarm.id, enabled)}
            toggling={Boolean(pendingToggles[alarm.id])}
          />
        ))}
      </ScrollView>
      <FloatingAddButton
        disabled={busy}
        onPress={() => navigation.navigate('Editor', {alarm: null})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  scheduledHeader: {
    marginBottom: 12,
    marginTop: 18,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
});
