import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {AppIcon} from '../components/AppIcon';
import {BrandHeader} from '../components/BrandHeader';
import {ScreenContainer} from '../components/ScreenContainer';
import {SurfaceCard} from '../components/SurfaceCard';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';

export function VisionScreen() {
  const navigation = useNavigation();
  const {colors, typography} = useTheme();
  return (
    <ScreenContainer>
      <BrandHeader subtitle="VISION" />
      <SurfaceCard style={styles.card}>
        <Text style={[typography.screenTitle, {color: colors.text}]}>Coming soon</Text>
        <Text style={[typography.body, styles.body, {color: colors.textSoft}]}>
          Vision board missions will live here. Alarm scheduling is unchanged.
        </Text>
      </SurfaceCard>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open puzzle lab"
        accessibilityHint="Try the tile swap puzzle prototype"
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.lg,
  },
  body: {
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  puzzleCard: {
    marginTop: spacing.md,
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
