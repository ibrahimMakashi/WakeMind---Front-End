import React, {useCallback, useMemo, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppIcon} from '../../components/AppIcon';
import {useTheme} from '../../theme/ThemeProvider';

export function MissionCompletionScreen({
  alarmId = '',
  occurrenceId = '',
  label = 'Alarm',
  triggerAtMillis = Date.now(),
  onDismiss,
  isDismissing = false,
}) {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const [pressedOnce, setPressedOnce] = useState(false);

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

  const handleFinalCTA = useCallback(() => {
    if (pressedOnce || isDismissing) {
      return;
    }
    setPressedOnce(true);
    if (onDismiss) {
      onDismiss();
    }
  }, [isDismissing, onDismiss, pressedOnce]);

  const disabled = pressedOnce || isDismissing;

  return (
    <View style={[styles.screen, {backgroundColor: colors.background || '#070C16'}]}>
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Top Status Pill */}
        <View
          style={[
            styles.protocolPill,
            {
              backgroundColor: colors.surfaceRaised || '#121927',
              borderColor: colors.border || '#1E293B',
            },
          ]}>
          <View style={styles.protocolDotSuccess} />
          <Text style={[styles.protocolText, {color: colors.accent || '#FFB84D'}]}>
            MISSION COMPLETE
          </Text>
        </View>

        {/* Celebratory Checkmark Icon with Glow */}
        <View style={styles.centralBadgeContainer}>
          <View style={styles.outerGlowRing} />
          <View style={styles.middleGlowRing} />
          <View
            style={[
              styles.checkCircle,
              {
                backgroundColor: colors.surfaceRaised || '#121927',
                borderColor: colors.accent || '#FFB84D',
              },
            ]}>
            <AppIcon color={colors.accent || '#FFB84D'} name="check" size={44} />
          </View>
        </View>

        {/* Time Display */}
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, {color: colors.text || '#FFFFFF'}]}>
            {alarmTime.timeText}
          </Text>
          <Text style={[styles.periodText, {color: colors.accent || '#FFB84D'}]}>
            {alarmTime.period}
          </Text>
        </View>

        {/* Large Celebratory Headline */}
        <Text style={[styles.headline, {color: colors.text || '#FFFFFF'}]}>
          WAKE MISSION COMPLETED
        </Text>

        <Text style={[styles.subheadline, {color: colors.textSubtle || '#94A3B8'}]}>
          You conquered the morning.
        </Text>

        {/* Vision Lock Disarmed Card */}
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: colors.card || '#121927',
              borderColor: colors.cardBorder || '#1E293B',
            },
          ]}>
          <View style={styles.statusCardRow}>
            <View style={styles.lockIconBox}>
              <AppIcon color={colors.accent || '#FFB84D'} name="lock-open-outline" size={22} />
            </View>
            <View style={styles.statusCardContent}>
              <Text style={[styles.statusCardTitle, {color: colors.text || '#FFFFFF'}]}>
                VISION LOCK DISARMED
              </Text>
              <Text style={[styles.statusCardDescription, {color: colors.textSubtle || '#94A3B8'}]}>
                Your discipline starts now. Stand tall and conquer the day.
              </Text>
            </View>
          </View>
        </View>

        {/* Spacer */}
        <View style={styles.flexSpacer} />

        {/* Final CTA: DISMISS ALARM */}
        <Pressable
          accessibilityLabel="Dismiss Alarm"
          accessibilityRole="button"
          disabled={disabled}
          onPress={handleFinalCTA}
          style={({pressed}) => [
            styles.finalButton,
            {
              backgroundColor: colors.accent || '#FFB84D',
              opacity: disabled ? 0.6 : pressed ? 0.9 : 1,
            },
          ]}>
          <Text style={[styles.finalButtonText, {color: colors.accentText || '#070C16'}]}>
            {isDismissing ? 'DISMISSING...' : 'DISMISS ALARM'}
          </Text>
          {!isDismissing ? (
            <AppIcon color={colors.accentText || '#070C16'} name="check-circle" size={20} />
          ) : null}
        </Pressable>

        <Text style={[styles.footerText, {color: colors.muted || '#64748B'}]}>
          Protocol complete. Have an unbroken, productive day.
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
  protocolPill: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  protocolDotSuccess: {
    backgroundColor: '#4CD964',
    borderRadius: 4,
    height: 8,
    marginRight: 8,
    width: 8,
  },
  protocolText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  centralBadgeContainer: {
    alignItems: 'center',
    height: 190,
    justifyContent: 'center',
    marginTop: 20,
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
    borderColor: 'rgba(255, 184, 77, 0.2)',
    borderRadius: 75,
    borderWidth: 1,
    height: 150,
    position: 'absolute',
    width: 150,
  },
  checkCircle: {
    alignItems: 'center',
    borderRadius: 48,
    borderWidth: 2,
    elevation: 8,
    height: 96,
    justifyContent: 'center',
    shadowColor: '#FFB84D',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 14,
    width: 96,
  },
  timeContainer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  timeText: {
    fontSize: 54,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 62,
  },
  periodText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    marginLeft: 6,
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 14,
    textAlign: 'center',
  },
  subheadline: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  statusCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 24,
    padding: 18,
    width: '100%',
  },
  statusCardRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  lockIconBox: {
    alignItems: 'center',
    backgroundColor: '#182234',
    borderColor: '#243046',
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  statusCardContent: {
    flex: 1,
    marginLeft: 14,
  },
  statusCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusCardDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  flexSpacer: {
    flex: 1,
    minHeight: 24,
  },
  finalButton: {
    alignItems: 'center',
    borderRadius: 16,
    elevation: 4,
    flexDirection: 'row',
    height: 56,
    justifyContent: 'center',
    shadowColor: '#FFB84D',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.35,
    shadowRadius: 8,
    width: '100%',
  },
  finalButtonText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    marginRight: 8,
  },
  footerText: {
    fontSize: 12,
    marginTop: 14,
    textAlign: 'center',
  },
});
