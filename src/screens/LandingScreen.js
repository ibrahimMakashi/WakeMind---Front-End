import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppIcon} from '../components/AppIcon';
import {ScreenContainer} from '../components/ScreenContainer';
import {SurfaceCard} from '../components/SurfaceCard';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';

export function LandingScreen() {
  const navigation = useNavigation();
  const {colors, typography, radius} = useTheme();
  const insets = useSafeAreaInsets();

  const handleBeginJourney = () => {
    navigation.replace('Main');
  };

  return (
    <ScreenContainer style={styles.screen} edges={[]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Top Status & Controls Header */}
        <View style={styles.topStatusBar}>
          <View style={styles.systemArmedRow}>
            <View style={styles.systemArmedDot} />
            <Text style={styles.systemArmedText}>SYSTEM ARMED</Text>
          </View>
          <View style={styles.soundButton}>
            <AppIcon name="volume-high" color="#D4A359" size={17} />
          </View>
        </View>

        {/* Top App Branding with Golden Ambient Glow */}
        <View style={styles.topBranding}>
          <View style={styles.glowContainer}>
            {/* Multi-layered soft ambient glow */}
            <View style={styles.glowLayer4} />
            <View style={styles.glowLayer3} />
            <View style={styles.glowLayer2} />
            <View style={styles.glowLayer1} />

            {/* Solid Golden Badge */}
            <View style={styles.brandBadge}>
              <AppIcon name="lightning-bolt" color="#1A1207" size={20} />
              <Text style={styles.brandBadgeText}>B - DISCIPLINE</Text>
            </View>
          </View>

          <Text style={styles.brandSubtitle}>DAWN ADHERENCE PROTOCOL</Text>
        </View>

        {/* Foundational Truth Quote Section */}
        <View style={styles.quoteContainer}>
          <SurfaceCard
            style={[
              styles.quoteCard,
              {
                backgroundColor: colors.surfaceRaised || colors.surface,
                borderColor: colors.borderSubtle || colors.border,
                borderRadius: radius.card || radius.lg,
              },
            ]}>
            <View style={styles.quoteHeader}>
              <AppIcon name="format-quote-close" color={colors.accent} size={20} />
              <Text style={[typography.cardHeading, styles.quoteCategory, {color: colors.accent}]}>
                FOUNDATIONAL TRUTH
              </Text>
            </View>

            <View style={styles.quoteBody}>
              <Text style={[styles.quoteTextLine, {color: colors.text}]}>
                "The curse of discipline is that every day looks the same.
              </Text>
              <Text style={[styles.quoteHighlightedLine, {color: colors.accent}]}>
                The curse of indiscipline is that every year looks the same."
              </Text>
            </View>

            <View style={styles.authorRow}>
              <Text style={[typography.caption, styles.authorText, {color: colors.textSubtle || colors.muted}]}>
                — Unknown
              </Text>
            </View>
          </SurfaceCard>
        </View>

        {/* Bottom CTA & Security Notice */}
        <View style={styles.bottomSection}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Begin my discipline journey"
            onPress={handleBeginJourney}
            style={({pressed}) => [
              styles.ctaButton,
              {
                backgroundColor: colors.accent,
                borderRadius: radius.pill,
              },
              pressed && styles.ctaButtonPressed,
            ]}>
            <Text style={[styles.ctaButtonText, {color: colors.accentText}]}>
              BEGIN MY DISCIPLINE JOURNEY
            </Text>
            <AppIcon name="arrow-right" color={colors.accentText} size={20} />
          </Pressable>

          <View style={styles.lockNotice}>
            <AppIcon name="lock-outline" color={colors.muted} size={14} />
            <Text style={[styles.lockNoticeText, {color: colors.muted}]}>
              NO SOFT DISMISSALS · ENCRYPTED ROUTINE LOCK
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: spacing.lg,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  topStatusBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  systemArmedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  systemArmedDot: {
    backgroundColor: '#FFA028',
    borderRadius: 999,
    height: 7,
    width: 7,
    shadowColor: '#FFA028',
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  systemArmedText: {
    color: '#D4A359',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  soundButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(21, 30, 46, 0.8)',
    borderColor: 'rgba(212, 163, 89, 0.25)',
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  topBranding: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  glowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 12,
  },
  glowLayer4: {
    backgroundColor: '#FFA028',
    borderRadius: 40,
    height: 52,
    opacity: 0.04,
    position: 'absolute',
    transform: [{scaleX: 1.55}, {scaleY: 2.1}],
    width: 220,
  },
  glowLayer3: {
    backgroundColor: '#FFA028',
    borderRadius: 32,
    height: 52,
    opacity: 0.08,
    position: 'absolute',
    transform: [{scaleX: 1.38}, {scaleY: 1.75}],
    width: 220,
  },
  glowLayer2: {
    backgroundColor: '#FFA028',
    borderRadius: 24,
    height: 52,
    opacity: 0.14,
    position: 'absolute',
    transform: [{scaleX: 1.22}, {scaleY: 1.45}],
    width: 220,
  },
  glowLayer1: {
    backgroundColor: '#FFA028',
    borderRadius: 18,
    height: 52,
    opacity: 0.22,
    position: 'absolute',
    transform: [{scaleX: 1.1}, {scaleY: 1.22}],
    width: 220,
  },
  brandBadge: {
    alignItems: 'center',
    backgroundColor: '#FFA028',
    borderRadius: 16,
    elevation: 12,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    shadowColor: '#FFA028',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.95,
    shadowRadius: 24,
  },
  brandBadgeText: {
    color: '#1A1207',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandSubtitle: {
    color: '#C49B58',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.4,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
  },
  quoteContainer: {
    marginVertical: spacing.xl,
  },
  quoteCard: {
    borderWidth: 1,
    padding: spacing.lg,
  },
  quoteHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  quoteCategory: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  quoteBody: {
    gap: spacing.xs,
  },
  quoteTextLine: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 28,
  },
  quoteHighlightedLine: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 28,
    marginTop: spacing.xs,
  },
  authorRow: {
    alignItems: 'flex-end',
    marginTop: spacing.md,
  },
  authorText: {
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  bottomSection: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  ctaButton: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    width: '100%',
    gap: 10,
    elevation: 4,
  },
  ctaButtonPressed: {
    opacity: 0.85,
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  lockNotice: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  lockNoticeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
