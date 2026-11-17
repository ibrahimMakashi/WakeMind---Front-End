import {useCallback, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import packageJson from '../../package.json';
import {useAlarms} from '../alarms/AlarmsProvider';
import {AppIcon} from '../components/AppIcon';
import {BrandHeader} from '../components/BrandHeader';
import {CapabilityNotices} from '../components/CapabilityNotices';
import {ScreenContainer} from '../components/ScreenContainer';
import {SurfaceCard} from '../components/SurfaceCard';
import {spacing} from '../constants/theme';
import {MAX_VISION_RITUALS, useVisionRituals} from '../hooks/useVisionRituals';
import {useTheme} from '../theme/ThemeProvider';
import {formatAlarmListTime, nextAlarm, relativeDayLabel} from '../utils/time';

const OPTIONS = [
  {
    mode: 'system',
    label: 'System',
    detail: 'Follows the device appearance.',
    icon: 'theme-light-dark',
  },
  {
    mode: 'light',
    label: 'Light',
    detail: 'Soft navy-tinted surfaces with amber accents.',
    icon: 'white-balance-sunny',
  },
  {
    mode: 'dark',
    label: 'Dark',
    detail: 'Midnight navy with amber mission controls.',
    icon: 'weather-night',
  },
];

export function ProfileScreen() {
  const {colors, mode, radius, setThemeMode, typography} = useTheme();
  const insets = useSafeAreaInsets();
  const {alarms, capability, loadError, busy, reload} = useAlarms();
  const {rituals, reload: reloadRituals} = useVisionRituals();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      reload().catch(refreshError => {
        setError(refreshError.message || 'Alarms could not be loaded.');
      });
      if (reloadRituals) {
        reloadRituals().catch(() => {});
      }
    }, [reload, reloadRituals]),
  );

  async function onSelect(nextMode) {
    if (saving || nextMode === mode) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      await setThemeMode(nextMode);
    } catch (saveError) {
      setError(saveError.message || 'The appearance could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  const activeCount = alarms.filter(a => a.enabled).length;
  const inactiveCount = alarms.filter(a => !a.enabled).length;
  const nextUpcoming = nextAlarm(alarms);
  const configuredRituals = rituals.length;

  const allPermissionsGranted =
    capability &&
    capability.exactAlarm !== 'needsScheduleExactAlarmGrant' &&
    capability.exactAlarm !== 'unavailable' &&
    capability.fullScreenIntent !== 'needsSettings' &&
    capability.notifications !== 'denied';

  return (
    <ScreenContainer style={styles.screen} edges={[]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <BrandHeader subtitle="PROFILE" />

        {/* 1. DISCIPLINE & ALARM OVERVIEW */}
        <Text style={[typography.sectionLabel, styles.section, {color: colors.muted}]}>
          DISCIPLINE OVERVIEW
        </Text>

        <View style={styles.metricsGrid}>
          <SurfaceCard
            accessibilityLabel={`Active alarms: ${activeCount}`}
            style={[
              styles.metricCard,
              {
                backgroundColor: colors.surfaceRaised,
                borderColor: colors.border,
                borderRadius: radius.md,
              },
            ]}>
            <View style={styles.metricIconWrap}>
              <AppIcon name="alarm-check" color={colors.accent} size={20} />
            </View>
            <Text style={[typography.statValue, styles.metricValue, {color: colors.text}]}>
              {activeCount}
            </Text>
            <Text style={[typography.caption, styles.metricLabel, {color: colors.muted}]}>
              Active Alarms
            </Text>
          </SurfaceCard>

          <SurfaceCard
            accessibilityLabel={`Inactive alarms: ${inactiveCount}`}
            style={[
              styles.metricCard,
              {
                backgroundColor: colors.surfaceRaised,
                borderColor: colors.border,
                borderRadius: radius.md,
              },
            ]}>
            <View style={styles.metricIconWrap}>
              <AppIcon name="alarm-off" color={colors.muted} size={20} />
            </View>
            <Text style={[typography.statValue, styles.metricValue, {color: colors.text}]}>
              {inactiveCount}
            </Text>
            <Text style={[typography.caption, styles.metricLabel, {color: colors.muted}]}>
              Inactive
            </Text>
          </SurfaceCard>

          <SurfaceCard
            accessibilityLabel={`Vision rituals: ${configuredRituals} of ${MAX_VISION_RITUALS} configured`}
            style={[
              styles.metricCard,
              {
                backgroundColor: colors.surfaceRaised,
                borderColor: colors.border,
                borderRadius: radius.md,
              },
            ]}>
            <View style={styles.metricIconWrap}>
              <AppIcon name="star-four-points-outline" color={colors.accent} size={20} />
            </View>
            <Text style={[typography.statValue, styles.metricValue, {color: colors.accent}]}>
              {configuredRituals}/{MAX_VISION_RITUALS}
            </Text>
            <Text style={[typography.caption, styles.metricLabel, {color: colors.muted}]}>
              Vision Rituals
            </Text>
          </SurfaceCard>
        </View>

        {/* Next Scheduled Alarm Card */}
        <SurfaceCard
          style={[
            styles.nextAlarmCard,
            {
              backgroundColor: colors.surfaceRaised,
              borderColor: colors.borderSubtle || colors.border,
              borderRadius: radius.md,
            },
          ]}>
          <View style={styles.nextAlarmHeader}>
            <View style={styles.nextAlarmHeaderLeft}>
              <AppIcon name="clock-outline" color={colors.accent} size={18} />
              <Text style={[typography.cardHeading, {color: colors.accent}]}>
                NEXT SCHEDULED ALARM
              </Text>
            </View>
            {nextUpcoming ? (
              <View
                style={[
                  styles.nextDayBadge,
                  {
                    backgroundColor: colors.badgeActiveBg,
                    borderColor: colors.badgeActiveBorder,
                    borderRadius: radius.badge || 6,
                  },
                ]}>
                <Text style={[styles.nextDayText, {color: colors.accent}]}>
                  {relativeDayLabel(nextUpcoming.triggerAtMillis)}
                </Text>
              </View>
            ) : null}
          </View>

          {nextUpcoming ? (
            <View style={styles.nextAlarmBody}>
              <Text style={[typography.listTime, styles.nextTimeText, {color: colors.text}]}>
                {formatAlarmListTime(nextUpcoming.hour, nextUpcoming.minute)}
              </Text>
              <Text
                numberOfLines={1}
                style={[typography.body, styles.nextLabelText, {color: colors.textSoft}]}>
                {nextUpcoming.label || 'Mission'}
              </Text>
            </View>
          ) : (
            <View style={styles.emptyNextAlarm}>
              <Text style={[typography.body, {color: colors.muted}]}>
                No active alarms scheduled
              </Text>
            </View>
          )}
        </SurfaceCard>

        {/* 2. REAL SETTINGS: APPEARANCE */}
        <Text style={[typography.sectionLabel, styles.section, {color: colors.muted}]}>
          APPEARANCE
        </Text>
        <View accessibilityRole="radiogroup">
          {OPTIONS.map(option => {
            const selected = mode === option.mode;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{selected, disabled: saving}}
                disabled={saving}
                key={option.mode}
                onPress={() => onSelect(option.mode)}
                style={({pressed}) => [
                  styles.option,
                  {
                    backgroundColor: colors.surfaceRaised,
                    borderColor: selected ? colors.accent : colors.border,
                    borderRadius: radius.md,
                  },
                  pressed && !saving && styles.pressed,
                ]}>
                <AppIcon
                  name={option.icon}
                  color={selected ? colors.accent : colors.muted}
                />
                <View style={styles.copy}>
                  <Text style={[typography.bodyStrong, {color: colors.text}]}>
                    {option.label}
                  </Text>
                  <Text style={[typography.caption, {color: colors.muted}]}>
                    {option.detail}
                  </Text>
                </View>
                {selected ? <AppIcon name="check" color={colors.accent} size={22} /> : null}
              </Pressable>
            );
          })}
        </View>

        {/* 3. REAL SETTINGS: ALARM & SYSTEM PERMISSIONS */}
        <Text style={[typography.sectionLabel, styles.section, {color: colors.muted}]}>
          ALARM PERMISSIONS
        </Text>
        <SurfaceCard
          style={[
            styles.permissionsCard,
            {
              backgroundColor: colors.surfaceRaised,
              borderColor: colors.border,
              borderRadius: radius.md,
            },
          ]}>
          <CapabilityNotices
            capability={capability}
            disabled={busy}
            onError={setError}
          />
          {allPermissionsGranted ? (
            <View style={styles.permissionOkRow}>
              <AppIcon name="shield-check-outline" color={colors.success} size={22} />
              <View style={styles.permissionOkCopy}>
                <Text style={[typography.bodyStrong, {color: colors.text}]}>
                  System Permissions Granted
                </Text>
                <Text style={[typography.caption, {color: colors.muted}]}>
                  Exact alarm and full-screen alerts are operational.
                </Text>
              </View>
            </View>
          ) : null}
        </SurfaceCard>

        {/* 4. ABOUT B-DISCIPLINE */}
        <Text style={[typography.sectionLabel, styles.section, {color: colors.muted}]}>
          ABOUT B-DISCIPLINE
        </Text>
        <SurfaceCard
          style={[
            styles.aboutCard,
            {
              backgroundColor: colors.surfaceRaised,
              borderColor: colors.border,
              borderRadius: radius.md,
            },
          ]}>
          <View style={styles.aboutHeader}>
            <View
              style={[
                styles.aboutIconTile,
                {
                  backgroundColor: colors.surfaceDeep,
                  borderColor: colors.borderSubtle || colors.border,
                  borderRadius: radius.icon,
                },
              ]}>
              <AppIcon name="lightning-bolt" color={colors.accent} size={22} />
            </View>
            <View style={styles.aboutTitleWrap}>
              <Text style={[typography.brandTitle, {color: colors.text}]}>
                B-DISCIPLINE
              </Text>
              <Text style={[typography.caption, {color: colors.muted}]}>
                {`Version ${packageJson.version}`}
              </Text>
            </View>
          </View>

          <Text style={[typography.body, styles.aboutDescription, {color: colors.textSoft}]}>
            Built for unwavering dawn adherence. No soft dismissals, no second chances. Master the morning, conquer the day.
          </Text>

          <View
            style={[
              styles.aboutFooter,
              {
                backgroundColor: colors.surfaceDeep,
                borderRadius: radius.sm,
              },
            ]}>
            <AppIcon name="lock-outline" color={colors.accent} size={15} />
            <Text style={[typography.caption, styles.aboutFooterText, {color: colors.accent}]}>
              Local-First Alarm Engine · 100% Offline & Private
            </Text>
          </View>
        </SurfaceCard>

        {error || loadError ? (
          <Text style={[typography.caption, styles.feedback, {color: colors.error}]}>
            {error || loadError}
          </Text>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: spacing.md,
  },
  content: {
    flexGrow: 1,
  },
  section: {
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: spacing.md,
  },
  metricIconWrap: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  nextAlarmCard: {
    borderWidth: 1,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  nextAlarmHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  nextAlarmHeaderLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  nextDayBadge: {
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  nextDayText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  nextAlarmBody: {
    marginTop: 4,
  },
  nextTimeText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  nextLabelText: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyNextAlarm: {
    paddingVertical: spacing.xs,
  },
  option: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    minHeight: 70,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.88,
  },
  copy: {
    flex: 1,
    marginLeft: spacing.md,
  },
  permissionsCard: {
    borderWidth: 1,
    padding: spacing.md,
  },
  permissionOkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  permissionOkCopy: {
    flex: 1,
  },
  aboutCard: {
    borderWidth: 1,
    padding: spacing.md,
  },
  aboutHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  aboutIconTile: {
    alignItems: 'center',
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  aboutTitleWrap: {
    flex: 1,
  },
  aboutDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  aboutFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  aboutFooterText: {
    fontSize: 11,
    fontWeight: '700',
  },
  feedback: {
    lineHeight: 20,
    marginTop: spacing.sm,
  },
});
