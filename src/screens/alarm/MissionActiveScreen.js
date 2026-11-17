import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppIcon} from '../../components/AppIcon';
import {getAlarmSoundName} from '../../constants/alarmSounds';
import {useTheme} from '../../theme/ThemeProvider';
import {usePrefersReducedMotion} from '../../theme/usePrefersReducedMotion';

export function MissionActiveScreen({
  alarmId = '',
  occurrenceId = '',
  canSnooze = true,
  label = 'Alarm',
  triggerAtMillis = Date.now(),
  sound = 'gentle_morning',
  difficulty = 'easy',
  onStartMission,
  onSnooze,
  snoozing = false,
  snoozeError = '',
}) {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const reducedMotion = usePrefersReducedMotion();
  const [starting, setStarting] = useState(false);

  const ringWaveAnim = useRef(new Animated.Value(0)).current;
  const bellShakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    // 1. Smooth expanding ripple wave animation
    const waveLoop = Animated.loop(
      Animated.timing(ringWaveAnim, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
      }),
    );

    // 2. Alarm bell rhythmic ringing wobble oscillation
    const bellLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bellShakeAnim, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(bellShakeAnim, {
          toValue: -1,
          duration: 110,
          useNativeDriver: true,
        }),
        Animated.timing(bellShakeAnim, {
          toValue: 1,
          duration: 110,
          useNativeDriver: true,
        }),
        Animated.timing(bellShakeAnim, {
          toValue: -0.5,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(bellShakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.delay(650),
      ]),
    );

    waveLoop.start();
    bellLoop.start();

    return () => {
      waveLoop.stop();
      bellLoop.stop();
    };
  }, [bellShakeAnim, reducedMotion, ringWaveAnim]);

  const outerScale = ringWaveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.28],
  });
  const outerOpacity = ringWaveAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.8, 0.45, 0],
  });

  const middleScale = ringWaveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.16],
  });
  const middleOpacity = ringWaveAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.9, 0.5, 0.1],
  });

  const bellRotate = bellShakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-10deg', '0deg', '10deg'],
  });
  const bellScale = bellShakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [1.06, 1.0, 1.06],
  });

  const alarmTime = useMemo(() => {
    const date = triggerAtMillis ? new Date(triggerAtMillis) : new Date();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return {
      timeText: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
      period,
    };
  }, [triggerAtMillis]);

  const soundTitle = useMemo(() => {
    if (label && label.toLowerCase() !== 'alarm') {
      return label;
    }
    return getAlarmSoundName(sound);
  }, [label, sound]);

  const missionConfig = useMemo(() => {
    if (difficulty === 'hard') {
      return {
        gridText: '5×5',
        levelText: 'Level 5',
      };
    }
    if (difficulty === 'medium' || difficulty === 'challenging') {
      return {
        gridText: '4×4',
        levelText: 'Level 4',
      };
    }
    if (difficulty === 'gentle') {
      return {
        gridText: 'Gentle Wake',
        levelText: 'Level 1',
      };
    }
    return {
      gridText: '3×3',
      levelText: 'Level 3',
    };
  }, [difficulty]);

  const handleBackPress = useCallback(() => {
    AccessibilityInfo.announceForAccessibility('Solve wake mission to stop alarm.');
    try {
      Vibration.vibrate(60);
    } catch {}
  }, []);

  const handleStart = useCallback(() => {
    if (starting) {
      return;
    }
    setStarting(true);
    if (onStartMission) {
      onStartMission();
    }
  }, [onStartMission, starting]);

  return (
    <View style={[styles.screen, {backgroundColor: colors.background || '#070C16'}]}>
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 20,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Back"
            accessibilityRole="button"
            hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
            onPress={handleBackPress}
            style={styles.backButton}>
            <AppIcon color={colors.text || '#FFFFFF'} name="chevron-left" size={28} />
          </Pressable>

          <Text style={[styles.headerTitle, {color: colors.text || '#FFFFFF'}]}>
            Mission Active
          </Text>

          <View style={[styles.profileButton, {backgroundColor: colors.accent || '#FFB84D'}]}>
            <AppIcon color={colors.accentText || '#070C16'} name="account" size={22} />
          </View>
        </View>

        {/* Protocol Badge */}
        <View style={styles.protocolRow}>
          <View
            style={[
              styles.protocolPill,
              {
                backgroundColor: colors.surfaceRaised || '#121927',
                borderColor: colors.border || '#1E293B',
              },
            ]}>
            <View style={[styles.protocolDot, {backgroundColor: colors.accent || '#FFB84D'}]} />
            <Text style={[styles.protocolText, {color: colors.accent || '#FFB84D'}]}>
              RINGING PROTOCOL
            </Text>
            <View style={styles.protocolDivider} />
            <AppIcon color={colors.accent || '#FFB84D'} name="volume-high" size={16} />
            <Text style={[styles.protocolVolume, {color: colors.textSoft || '#E2E8F0'}]}>
              100%
            </Text>
          </View>
        </View>

        {/* Sound / Name Pill */}
        <View style={styles.soundPillRow}>
          <View
            style={[
              styles.soundPill,
              {
                backgroundColor: colors.surface || '#0E1420',
                borderColor: colors.borderSubtle || '#1E293B',
              },
            ]}>
            <AppIcon color={colors.accent || '#FFB84D'} name="music-note" size={15} />
            <Text
              numberOfLines={1}
              style={[styles.soundPillText, {color: colors.textSoft || '#E2E8F0'}]}>
              {soundTitle}
            </Text>
          </View>
        </View>

        {/* Central Radial Alarm Bell with Live Ring Animation */}
        <View style={styles.centralVisualContainer}>
          <Animated.View
            style={[
              styles.outerGlowRing,
              {
                opacity: outerOpacity,
                transform: [{scale: outerScale}],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.middleGlowRing,
              {
                opacity: middleOpacity,
                transform: [{scale: middleScale}],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bellCircle,
              {
                backgroundColor: colors.surfaceRaised || '#121927',
                borderColor: colors.borderSubtle || '#243046',
                transform: [{scale: bellScale}, {rotate: bellRotate}],
              },
            ]}>
            <AppIcon color={colors.accent || '#FFB84D'} name="bell-ring" size={38} />
          </Animated.View>
        </View>

        {/* Big Time Display */}
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, {color: colors.text || '#FFFFFF'}]}>
            {alarmTime.timeText}
          </Text>
          <Text style={[styles.periodText, {color: colors.accent || '#FFB84D'}]}>
            {alarmTime.period}
          </Text>
        </View>

        {/* Motivational Title */}
        <Text style={[styles.missionTitle, {color: colors.accent || '#FFB84D'}]}>
          CONQUER THE MORNING
        </Text>

        {/* Streak Indicator Pill */}
        <View style={styles.streakRow}>
          <View
            style={[
              styles.streakPill,
              {
                borderColor: colors.border || '#1E293B',
              },
            ]}>
            <AppIcon color={colors.accent || '#FFB84D'} name="shield-check-outline" size={16} />
            <Text style={[styles.streakText, {color: colors.textSoft || '#E2E8F0'}]}>
              STREAK: 14 DAYS UNBROKEN
            </Text>
          </View>
        </View>

        {/* Vision Lock Active Card */}
        <View
          style={[
            styles.visionCard,
            {
              backgroundColor: colors.card || '#121927',
              borderColor: colors.cardBorder || '#1E293B',
            },
          ]}>
          <View style={styles.visionCardHeader}>
            <View style={styles.visionIconBox}>
              <AppIcon color={colors.accent || '#FFB84D'} name="grid" size={20} />
            </View>
            <View style={styles.visionMainContent}>
              <Text style={[styles.visionTitle, {color: colors.text || '#FFFFFF'}]}>
                VISION LOCK ACTIVE
              </Text>
              <Text style={[styles.visionDescription, {color: colors.textSubtle || '#94A3B8'}]}>
                Complete the {missionConfig.gridText} Mind Matrix challenge to disarm this acoustic protocol.
              </Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{missionConfig.levelText}</Text>
            </View>
          </View>
        </View>

        {/* Primary CTA: START WAKE MISSION */}
        <Pressable
          accessibilityLabel="Start Wake Mission"
          accessibilityRole="button"
          disabled={starting}
          onPress={handleStart}
          style={({pressed}) => [
            styles.startMissionButton,
            {
              backgroundColor: colors.accent || '#FFB84D',
              opacity: pressed ? 0.9 : 1,
            },
          ]}>
          <Text style={[styles.startMissionText, {color: colors.accentText || '#070C16'}]}>
            START WAKE MISSION
          </Text>
          <AppIcon color={colors.accentText || '#070C16'} name="arrow-right" size={20} />
        </Pressable>

        {/* Snooze Button */}
        <Pressable
          accessibilityLabel="Discipline Snooze 5 minutes"
          accessibilityRole="button"
          disabled={!canSnooze || snoozing}
          onPress={onSnooze}
          style={({pressed}) => [
            styles.snoozeContainer,
            {
              backgroundColor: colors.surfaceRaised || '#121927',
              borderColor: colors.border || '#1E293B',
              opacity: !canSnooze ? 0.45 : pressed ? 0.85 : 1,
            },
          ]}>
          <View style={styles.snoozeLeft}>
            <AppIcon color={colors.textSoft || '#E2E8F0'} name="clock-outline" size={18} />
            <Text style={[styles.snoozeText, {color: colors.textSoft || '#E2E8F0'}]}>
              Discipline Snooze (5m)
            </Text>
          </View>
          <View style={styles.penaltyBadge}>
            <AppIcon color="#E06B7A" name="alert" size={13} />
            <Text style={styles.penaltyText}>+1 PENALTY</Text>
          </View>
        </Pressable>

        {snoozeError ? (
          <Text style={[styles.errorText, {color: colors.error || '#E06B7A'}]}>
            {snoozeError}
          </Text>
        ) : null}

        {/* Bottom Disclaimer */}
        <Text style={[styles.footerText, {color: colors.muted || '#64748B'}]}>
          No shortcuts. Your future self is built before 07:00 AM.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    width: '100%',
  },
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  profileButton: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  protocolRow: {
    alignItems: 'center',
    marginTop: 4,
    width: '100%',
  },
  protocolPill: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  protocolDot: {
    borderRadius: 4,
    height: 8,
    marginRight: 8,
    width: 8,
  },
  protocolText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  protocolDivider: {
    backgroundColor: '#2A364E',
    height: 12,
    marginHorizontal: 12,
    width: 1,
  },
  protocolVolume: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
  soundPillRow: {
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  soundPill: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    maxWidth: '90%',
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  soundPillText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  centralVisualContainer: {
    alignItems: 'center',
    height: 180,
    justifyContent: 'center',
    marginTop: 14,
    position: 'relative',
    width: 220,
  },
  outerGlowRing: {
    borderColor: 'rgba(255, 184, 77, 0.08)',
    borderRadius: 110,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 220,
    position: 'absolute',
    width: 220,
  },
  middleGlowRing: {
    borderColor: 'rgba(255, 184, 77, 0.16)',
    borderRadius: 75,
    borderWidth: 1,
    height: 150,
    position: 'absolute',
    width: 150,
  },
  bellCircle: {
    alignItems: 'center',
    borderRadius: 46,
    borderWidth: 1,
    elevation: 6,
    height: 92,
    justifyContent: 'center',
    shadowColor: '#FFB84D',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    width: 92,
  },
  timeContainer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  timeText: {
    fontSize: 62,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 70,
  },
  periodText: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 8,
  },
  missionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 4,
    textAlign: 'center',
  },
  streakRow: {
    alignItems: 'center',
    marginTop: 10,
  },
  streakPill: {
    alignItems: 'center',
    backgroundColor: '#101726',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  visionCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 18,
    padding: 16,
    width: '100%',
  },
  visionCardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  visionIconBox: {
    alignItems: 'center',
    backgroundColor: '#182234',
    borderColor: '#243046',
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  visionMainContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  visionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  visionDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  levelBadge: {
    backgroundColor: '#1E1912',
    borderColor: '#4A3319',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  levelText: {
    color: '#FFB84D',
    fontSize: 11,
    fontWeight: '700',
  },
  startMissionButton: {
    alignItems: 'center',
    borderRadius: 16,
    elevation: 4,
    flexDirection: 'row',
    height: 56,
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#FFB84D',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.35,
    shadowRadius: 8,
    width: '100%',
  },
  startMissionText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    marginRight: 8,
  },
  snoozeContainer: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    height: 48,
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 16,
    width: '100%',
  },
  snoozeLeft: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  snoozeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  penaltyBadge: {
    alignItems: 'center',
    backgroundColor: '#2A141A',
    borderColor: '#4D1B26',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  penaltyText: {
    color: '#E06B7A',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 12,
    marginTop: 14,
    textAlign: 'center',
  },
});
