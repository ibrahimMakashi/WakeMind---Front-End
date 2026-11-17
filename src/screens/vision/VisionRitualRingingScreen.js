import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppIcon} from '../../components/AppIcon';
import {SurfaceCard} from '../../components/SurfaceCard';
import {spacing} from '../../constants/theme';
import {
  canSnoozeAlarm,
  dismissAlarmAfterPuzzle,
  finishRingingActivity,
  getVisionRituals,
  snoozeAlarm,
} from '../../services/alarmService';
import {useTheme} from '../../theme/ThemeProvider';
import {formatListTimeParts} from '../../utils/time';

export function VisionRitualRingingScreen({
  alarmId = '',
  occurrenceId = '',
  label = 'Vision Ritual',
  triggerAtMillis = Date.now(),
  ritualText = '',
  repetitionTarget = 10,
  canSnooze: initialCanSnooze = true,
}) {
  const insets = useSafeAreaInsets();
  const {colors, typography, radius} = useTheme();

  const [count, setCount] = useState(0);
  const [stage, setStage] = useState('ringing'); // 'ringing' | 'completion'
  const [isDismissing, setIsDismissing] = useState(false);
  const [snoozeAllowed, setSnoozeAllowed] = useState(initialCanSnooze);
  const [snoozing, setSnoozing] = useState(false);
  const [loadedRitual, setLoadedRitual] = useState(null);

  const dismissingRef = useRef(false);
  const finalDismissedRef = useRef(false);
  const lastTapRef = useRef(0);

  // Fallback load ritual configuration specifically matching this alarmId
  useEffect(() => {
    let active = true;
    if ((!ritualText || !repetitionTarget) && alarmId) {
      getVisionRituals()
        .then(rituals => {
          if (active && Array.isArray(rituals)) {
            const found = rituals.find(r => r.id === alarmId);
            if (found) {
              setLoadedRitual(found);
            }
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [alarmId, ritualText, repetitionTarget]);

  const activeText = (ritualText || loadedRitual?.ritualText || '').trim();
  const activeTarget = repetitionTarget || loadedRitual?.repetitionTarget || 10;

  // Pulse animation for ringing indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Suppress Android hardware back press
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      AccessibilityInfo.announceForAccessibility('Vision Ritual in progress.');
      Vibration.vibrate(60);
      return true;
    });
    return () => sub.remove();
  }, []);

  // Sync snooze capability with native engine
  useEffect(() => {
    let active = true;
    if (alarmId && occurrenceId) {
      canSnoozeAlarm(alarmId, occurrenceId)
        .then(allowed => {
          if (active) {
            setSnoozeAllowed(allowed);
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [alarmId, occurrenceId]);

  const timeParts = useMemo(() => {
    const date = triggerAtMillis ? new Date(triggerAtMillis) : new Date();
    return formatListTimeParts(date.getHours(), date.getMinutes());
  }, [triggerAtMillis]);

  // Target reached -> immediately stop audio + vibration, switch to completion
  const handleComplete = useCallback(async () => {
    if (dismissingRef.current) {return;}
    dismissingRef.current = true;
    setIsDismissing(true);
    try {
      if (alarmId && occurrenceId) {
        await dismissAlarmAfterPuzzle(alarmId, occurrenceId);
      }
    } catch (err) {
      console.warn('Alarm audio dismissal error on ritual complete:', err);
    } finally {
      setIsDismissing(false);
      setStage('completion');
      Vibration.vibrate([0, 100, 100, 200]);
    }
  }, [alarmId, occurrenceId]);

  // Debounced tap handler for COUNT button
  const handleCountTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 180) {
      return; // Debounce
    }
    lastTapRef.current = now;

    if (count >= activeTarget || dismissingRef.current) {
      return;
    }

    const next = count + 1;
    setCount(next);
    Vibration.vibrate(40);

    if (next >= activeTarget) {
      handleComplete();
    }
  }, [count, activeTarget, handleComplete]);

  // Snooze action
  const handleSnooze = useCallback(async () => {
    if (snoozing || dismissingRef.current || !snoozeAllowed) {return;}
    setSnoozing(true);
    try {
      await snoozeAlarm(alarmId, occurrenceId);
      await finishRingingActivity();
    } catch (err) {
      console.warn('Snooze error:', err);
      setSnoozing(false);
    }
  }, [snoozing, snoozeAllowed, alarmId, occurrenceId]);

  // Done button on completion
  const handleFinalDone = useCallback(async () => {
    if (finalDismissedRef.current) {return;}
    finalDismissedRef.current = true;
    try {
      await finishRingingActivity();
    } catch (err) {
      console.warn('Finish ringing activity error:', err);
      finalDismissedRef.current = false;
    }
  }, []);

  const progressPercent = Math.min(100, Math.round((count / activeTarget) * 100));

  if (stage === 'completion') {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + spacing.xl,
            paddingTop: insets.top + spacing.xl,
          },
        ]}>
        <View style={styles.completionContent}>
          <View
            style={[
              styles.successCircle,
              {backgroundColor: colors.accent},
            ]}>
            <AppIcon color={colors.accentText || '#0B111D'} name="check-bold" size={44} />
          </View>

          <Text style={[typography.screenTitle, styles.completionTitle, {color: colors.text}]}>
            Vision Ritual Complete
          </Text>

          <Text style={[typography.body, styles.completionSubtitle, {color: colors.textSoft}]}>
            Affirmation recited {activeTarget} times.
          </Text>

          <SurfaceCard style={[styles.completionQuoteCard, {borderRadius: radius.md}]}>
            <AppIcon color={colors.accent} name="format-quote-open" size={24} />
            <Text
              numberOfLines={4}
              style={[typography.bodyStrong, styles.completionQuote, {color: colors.text}]}>
              {activeText || 'Discipline is destiny.'}
            </Text>
          </SurfaceCard>

          <Text style={[typography.caption, styles.mottoText, {color: colors.accent}]}>
            STAND TALL & EXECUTE TODAY
          </Text>
        </View>

        <Pressable
          accessibilityLabel="Done"
          accessibilityRole="button"
          onPress={handleFinalDone}
          style={[
            styles.doneBtn,
            {backgroundColor: colors.accent, borderRadius: radius.md},
          ]}>
          <Text style={[typography.bodyStrong, styles.doneBtnText, {color: colors.accentText || '#0B111D'}]}>
            Done
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingBottom: insets.bottom + spacing.md,
          paddingTop: insets.top + spacing.md,
        },
      ]}>
      {/* 1. Ringing Header */}
      <View style={styles.header}>
        <Animated.View
          style={[
            styles.ringingIconWrapper,
            {
              backgroundColor: colors.surfaceDeep || '#151D2A',
              borderColor: colors.accent,
              transform: [{scale: pulseAnim}],
            },
          ]}>
          <AppIcon color={colors.accent} name="bell-ring" size={26} />
        </Animated.View>

        <Text style={[typography.caption, styles.headerSubtitle, {color: colors.accent}]}>
          VISION RITUAL
        </Text>

        <View style={styles.timeRow}>
          <Text style={[typography.listTime, styles.timeText, {color: colors.text}]}>
            {timeParts.timeText}
          </Text>
          <Text style={[typography.listPeriod, styles.periodText, {color: colors.accent}]}>
            {timeParts.period}
          </Text>
        </View>
      </View>

      {/* 2. Affirmation Text Container (Scrollable) */}
      <SurfaceCard style={[styles.textCard, {borderRadius: radius.lg}]}>
        <View style={styles.cardHeaderRow}>
          <AppIcon color={colors.accent} name="star-four-points" size={18} />
          <Text style={[typography.cardHeading, {color: colors.accent}]}>
            RECITE OUT LOUD
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.textScrollContent}
          showsVerticalScrollIndicator={true}
          style={styles.textScroll}>
          <Text style={[typography.body, styles.affirmationText, {color: colors.text}]}>
            {activeText || 'I am focused, disciplined, and ready to conquer today.'}
          </Text>
        </ScrollView>
      </SurfaceCard>

      {/* 3. Recitation Progress & Counter */}
      <View style={styles.progressSection}>
        <View style={styles.counterRow}>
          <Text style={[typography.cardHeading, {color: colors.textSoft}]}>
            {`RECITE ${activeTarget} TIMES`}
          </Text>
          <Text style={[typography.screenTitle, styles.counterNumber, {color: colors.accent}]}>
            {count} / {activeTarget}
          </Text>
        </View>

        <View style={[styles.progressBarTrack, {backgroundColor: colors.surfaceDeep || '#151D2A'}]}>
          <View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: colors.accent,
                width: `${progressPercent}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* 4. Prominent Count Button */}
      <Pressable
        accessibilityLabel={`Count recitation ${count} of ${activeTarget}`}
        accessibilityRole="button"
        disabled={count >= activeTarget || isDismissing}
        onPress={handleCountTap}
        style={({pressed}) => [
          styles.countBtn,
          {backgroundColor: colors.accent, borderRadius: radius.md},
          pressed && styles.countBtnPressed,
        ]}>
        <AppIcon
          color={colors.accentText || '#0B111D'}
          name="checkbox-marked-circle-outline"
          size={24}
        />
        <Text style={[typography.screenTitle, styles.countBtnText, {color: colors.accentText || '#0B111D'}]}>
          {count >= activeTarget ? 'COMPLETING...' : 'COUNT'}
        </Text>
      </Pressable>

      {/* 5. Snooze Option (if eligible) */}
      {snoozeAllowed && (
        <Pressable
          accessibilityLabel="Snooze alarm for 5 minutes"
          accessibilityRole="button"
          disabled={snoozing || count >= activeTarget}
          onPress={handleSnooze}
          style={styles.snoozeBtn}>
          <Text style={[typography.bodyStrong, {color: colors.muted}]}>
            {snoozing ? 'Snoozing...' : 'Snooze (5 min)'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ringingIconWrapper: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1.5,
    height: 48,
    justifyContent: 'center',
    marginBottom: 6,
    width: 48,
  },
  headerSubtitle: {
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  timeRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  timeText: {
    fontSize: 34,
    fontWeight: '800',
  },
  periodText: {
    fontSize: 16,
    fontWeight: '800',
  },
  textCard: {
    flex: 1,
    marginVertical: spacing.sm,
    padding: spacing.md,
  },
  cardHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.xs,
  },
  textScroll: {
    flex: 1,
  },
  textScrollContent: {
    paddingVertical: spacing.xs,
  },
  affirmationText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 28,
  },
  progressSection: {
    gap: 8,
    marginVertical: spacing.sm,
  },
  counterRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  counterNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  progressBarTrack: {
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    borderRadius: 4,
    height: '100%',
  },
  countBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    height: 60,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  countBtnPressed: {
    opacity: 0.88,
    transform: [{scale: 0.98}],
  },
  countBtnText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  snoozeBtn: {
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  completionContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  successCircle: {
    alignItems: 'center',
    height: 96,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 96,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  completionSubtitle: {
    fontSize: 16,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  completionQuoteCard: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    width: '100%',
  },
  completionQuote: {
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
  },
  mottoText: {
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  doneBtn: {
    alignItems: 'center',
    height: 54,
    justifyContent: 'center',
    width: '100%',
  },
  doneBtnText: {
    fontSize: 17,
    fontWeight: '800',
  },
});
