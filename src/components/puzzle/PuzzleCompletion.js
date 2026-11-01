import {Animated, StyleSheet, Text, View} from 'react-native';
import {spacing} from '../../constants/theme';
import {PrimaryButton} from '../PrimaryButton';
import {AppIcon} from '../AppIcon';
import {useTheme} from '../../theme/ThemeProvider';

export function PuzzleCompletion({visible, moveCount, checkScale, onNewPuzzle}) {
  const {colors, typography} = useTheme();
  if (!visible) {
    return null;
  }
  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceRaised,
            borderColor: colors.border,
          },
        ]}>
        <Animated.View style={{transform: [{scale: checkScale}]}}>
          <AppIcon color={colors.accent} name="check-circle" size={44} />
        </Animated.View>
        <Text style={[typography.screenTitle, styles.title, {color: colors.text}]}>
          Puzzle complete
        </Text>
        <Text style={[typography.body, {color: colors.textSoft}]}>
          Finished in {moveCount} {moveCount === 1 ? 'move' : 'moves'}.
        </Text>
        <View style={styles.buttonWrap}>
          <PrimaryButton label="New puzzle" onPress={onNewPuzzle} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    width: '100%',
  },
  card: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    maxWidth: 340,
    padding: spacing.lg,
    width: '100%',
  },
  title: {
    marginTop: spacing.xs,
  },
  buttonWrap: {
    marginTop: spacing.xs,
    width: '100%',
  },
});
