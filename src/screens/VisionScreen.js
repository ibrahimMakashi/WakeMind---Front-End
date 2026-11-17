import {useCallback} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppIcon} from '../components/AppIcon';
import {BrandHeader} from '../components/BrandHeader';
import {ScreenContainer} from '../components/ScreenContainer';
import {SurfaceCard} from '../components/SurfaceCard';
import {VisionRitualCard} from '../components/vision/VisionRitualCard';
import {spacing} from '../constants/theme';
import {MAX_VISION_RITUALS, useVisionRituals} from '../hooks/useVisionRituals';
import {useTheme} from '../theme/ThemeProvider';

export function VisionScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {colors, typography, radius} = useTheme();
  const {
    rituals,
    loading,
    error,
    busyId,
    reload,
    toggleRitual,
    count,
    canAdd,
  } = useVisionRituals();

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return (
    <ScreenContainer>
      <BrandHeader subtitle="VISION" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {paddingBottom: insets.bottom + spacing.xl},
        ]}
        showsVerticalScrollIndicator={false}>
        {/* SECTION 1: VISION RITUAL */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleRow}>
              <Text style={[typography.screenTitle, styles.sectionTitle, {color: colors.text}]}>
                Vision Ritual
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
                  {count} / {MAX_VISION_RITUALS}
                </Text>
              </View>
            </View>
            <Text style={[typography.caption, styles.sectionSubtitle, {color: colors.textSoft}]}>
              Affirmation alarms to recite out loud each morning.
            </Text>
          </View>

          {/* Error Message */}
          {Boolean(error) && (
            <View style={[styles.errorBanner, {backgroundColor: colors.dangerSubtle || '#3B1820'}]}>
              <AppIcon color={colors.danger || '#EF4444'} name="alert-circle-outline" size={16} />
              <Text style={[typography.caption, {color: colors.danger || '#EF4444'}]}>
                {error}
              </Text>
            </View>
          )}

          {/* Loading Indicator */}
          {loading && count === 0 ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.accent} size="small" />
            </View>
          ) : null}

          {/* Ritual Cards */}
          {rituals.map(ritual => (
            <VisionRitualCard
              key={ritual.id}
              onEdit={() => navigation.navigate('VisionRitualEditor', {ritual})}
              onToggle={() => toggleRitual(ritual.id, ritual.enabled)}
              ritual={ritual}
              toggling={busyId === ritual.id}
            />
          ))}

          {/* Empty State */}
          {!loading && count === 0 && (
            <SurfaceCard style={styles.emptyCard}>
              <AppIcon color={colors.accent} name="star-shooting-outline" size={32} />
              <Text style={[typography.bodyStrong, styles.emptyTitle, {color: colors.text}]}>
                No Vision Ritual Yet
              </Text>
              <Text style={[typography.caption, styles.emptySubtitle, {color: colors.textSoft}]}>
                Set up a dedicated morning affirmation alarm to start your day with discipline.
              </Text>
              <Pressable
                accessibilityLabel="Create Vision Ritual"
                accessibilityRole="button"
                onPress={() => navigation.navigate('VisionRitualEditor')}
                style={[
                  styles.createBtn,
                  {backgroundColor: colors.accent, borderRadius: radius.md},
                ]}>
                <Text style={[typography.bodyStrong, {color: colors.accentText || '#0B111D'}]}>
                  Create Vision Ritual
                </Text>
              </Pressable>
            </SurfaceCard>
          )}

          {/* Add Button (when count < 3 and not empty) */}
          {count > 0 && canAdd && (
            <Pressable
              accessibilityLabel="Add another Vision Ritual"
              accessibilityRole="button"
              onPress={() => navigation.navigate('VisionRitualEditor')}
              style={[
                styles.addBtn,
                {borderColor: colors.accent, borderRadius: radius.md},
              ]}>
              <AppIcon color={colors.accent} name="plus" size={18} />
              <Text style={[typography.bodyStrong, {color: colors.accent}]}>
                Add Vision Ritual
              </Text>
            </Pressable>
          )}

          {/* Max Limit Indicator */}
          {count >= MAX_VISION_RITUALS && (
            <View style={styles.limitNotice}>
              <AppIcon color={colors.muted} name="information-outline" size={14} />
              <Text style={[typography.caption, {color: colors.muted}]}>
                Maximum 3 Vision Ritual alarms reached.
              </Text>
            </View>
          )}
        </View>

        {/* SECTION 2: PUZZLE LAB (Directly Underneath) */}
        <View style={styles.section}>
          <Pressable
            accessibilityHint="Try the tile swap puzzle prototype"
            accessibilityLabel="Open puzzle lab"
            accessibilityRole="button"
            onPress={() => navigation.navigate('Puzzle')}
            style={({pressed}) => [styles.puzzleCard, pressed && styles.pressed]}>
            <SurfaceCard style={styles.puzzleInner}>
              <View style={styles.puzzleRow}>
                <AppIcon color={colors.accent} name="puzzle-outline" size={28} />
                <View style={styles.puzzleCopy}>
                  <Text style={[typography.bodyStrong, {color: colors.text}]}>Puzzle lab</Text>
                  <Text style={[typography.caption, {color: colors.textSoft}]}>
                    Drag, swap, and solve a sample picture puzzle.
                  </Text>
                </View>
                <AppIcon color={colors.muted} name="chevron-right" size={22} />
              </View>
            </SurfaceCard>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: spacing.lg,
    paddingTop: spacing.sm,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    marginBottom: spacing.xs,
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
  sectionSubtitle: {
    marginTop: 2,
  },
  errorBanner: {
    alignItems: 'center',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 6,
    padding: spacing.xs,
  },
  loadingBox: {
    padding: spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.xs,
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
    paddingVertical: spacing.sm,
  },
  addBtn: {
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    marginTop: spacing.xs,
    paddingVertical: spacing.sm + 2,
  },
  limitNotice: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  puzzleCard: {
    marginTop: spacing.xs,
  },
  pressed: {
    opacity: 0.92,
  },
  puzzleInner: {
    paddingVertical: spacing.md,
  },
  puzzleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  puzzleCopy: {
    flex: 1,
    gap: 2,
  },
});
