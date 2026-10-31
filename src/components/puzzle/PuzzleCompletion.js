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
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={[styles.card, {backgroundColor: colors.surfaceRaised, borderColor: colors.border}]}>
        <Animated.View style={{transform: [{scale: checkScale}]}}>
          <AppIcon color={colors.accent} name="check-circle" size={40} />
        </Animated.View>
        <Text style={[typography.screenTitle, styles.title, {color: colors.text}]}>
          Puzzle complete
        </Text>
        <Text style={[typography.body, {color: colors.textSoft}]}>
          Finished in {moveCount} {moveCount === 1 ? 'move' : 'moves'}.
        </Text>
        <PrimaryButton label="New puzzle" onPress={onNewPuzzle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    maxWidth: 320,
    padding: spacing.lg,
    width: '100%',
  },
  title: {
    marginTop: spacing.xs,
  },
});
