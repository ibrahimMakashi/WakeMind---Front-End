import {StyleSheet, Text} from 'react-native';
import {BrandHeader} from '../components/BrandHeader';
import {ScreenContainer} from '../components/ScreenContainer';
import {SurfaceCard} from '../components/SurfaceCard';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';

export function JournalScreen() {
  const {colors, typography} = useTheme();
  return (
    <ScreenContainer>
      <BrandHeader subtitle="JOURNAL" />
      <SurfaceCard style={styles.card}>
        <Text style={[typography.screenTitle, {color: colors.text}]}>Coming soon</Text>
        <Text style={[typography.body, styles.body, {color: colors.textSoft}]}>
          Daily journal entries are not part of this release yet.
        </Text>
      </SurfaceCard>
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
});
