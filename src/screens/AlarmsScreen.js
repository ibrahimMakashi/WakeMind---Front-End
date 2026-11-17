import {useCallback, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAlarms} from '../alarms/AlarmsProvider';
import {AlarmCard} from '../components/AlarmCard';
import {AppIcon} from '../components/AppIcon';
import {BrandHeader} from '../components/BrandHeader';
import {FAB_BOTTOM_GAP, FAB_SIZE, FloatingAddButton} from '../components/FloatingAddButton';
import {SurfaceCard} from '../components/SurfaceCard';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';
import {sortAlarms} from '../utils/time';

export function AlarmsScreen() {
  const navigation = useNavigation();
  const {colors, typography, radius} = useTheme();
  const insets = useSafeAreaInsets();
  const {alarms, loadError, busy, reload, toggleEnabled} = useAlarms();
  const [error, setError] = useState('');
  const [pendingToggles, setPendingToggles] = useState({});
  const orderedAlarms = useMemo(() => sortAlarms(alarms), [alarms]);
  const hasAlarms = orderedAlarms.length > 0;
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
        <BrandHeader subtitle="ALARMS" />

        {/* Error Banner */}
        {Boolean(error || loadError) && (
          <View style={[styles.errorBanner, {backgroundColor: colors.dangerSubtle || '#3B1820'}]}>
            <AppIcon color={colors.danger || '#EF4444'} name="alert-circle-outline" size={16} />
            <Text style={[typography.caption, {color: colors.danger || '#EF4444'}]}>
              {error || loadError}
            </Text>
          </View>
        )}

        {/* Empty State: Shown strictly when zero alarms exist */}
        {!hasAlarms && (
          <SurfaceCard style={styles.emptyCard}>
            <AppIcon color={colors.accent} name="alarm-plus" size={32} />
            <Text style={[typography.bodyStrong, styles.emptyTitle, {color: colors.text}]}>
              Create Your First Alarm
            </Text>
            <Text style={[typography.caption, styles.emptySubtitle, {color: colors.textSoft}]}>
              Start your discipline journey by setting your first alarm.
            </Text>
            <Pressable
              accessibilityLabel="Create Alarm"
              accessibilityRole="button"
              onPress={() => navigation.navigate('Editor', {alarm: null})}
              style={[
                styles.createBtn,
                {backgroundColor: colors.accent, borderRadius: radius?.md || 16},
              ]}>
              <Text style={[typography.bodyStrong, {color: colors.accentText || '#0B111D'}]}>
                + CREATE ALARM
              </Text>
            </Pressable>
          </SurfaceCard>
        )}

        {/* Section Header: Styled identically to Vision Ritual title (white, bold 20px) */}
        {hasAlarms && (
          <View style={styles.sectionHeader}>
            <View style={styles.titleRow}>
              <Text style={[typography.screenTitle, styles.sectionTitle, {color: colors.text}]}>
                Scheduled Alarms
              </Text>
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: colors.surfaceDeep || '#151D2A',
                    borderColor: colors.accent,
                    borderRadius: radius?.sm || 6,
                  },
                ]}>
                <Text style={[typography.caption, styles.countText, {color: colors.accent}]}>
                  {`${orderedAlarms.length} Configured`}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Alarm Cards List */}
        {hasAlarms &&
          orderedAlarms.map(alarm => (
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
  sectionHeader: {
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  countBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  emptyTitle: {
    fontSize: 16,
    marginTop: spacing.xs,
  },
  emptySubtitle: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  createBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  errorBanner: {
    alignItems: 'center',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    padding: spacing.xs,
  },
});
