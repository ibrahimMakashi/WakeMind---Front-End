import {Pressable, StyleSheet, Text, View} from 'react-native';
import {spacing} from '../../constants/theme';
import {PrimaryButton} from '../PrimaryButton';
import {useTheme} from '../../theme/ThemeProvider';

const DIFFICULTIES = [
  {id: 'easy', label: 'Easy 3×3'},
  {id: 'medium', label: 'Medium 4×4'},
  {id: 'hard', label: 'Hard 5×5'},
];

export function PuzzleHud({
  difficulty,
  moveCount,
  onSelectDifficulty,
  onShuffle,
  disabled,
}) {
  const {colors, typography, radius} = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[typography.sectionLabel, {color: colors.muted}]}>
        TRAINING PUZZLE
      </Text>
      <Text style={[typography.bodyStrong, styles.moves, {color: colors.text}]}>
        Moves: {moveCount}
      </Text>
      <View style={styles.row}>
        {DIFFICULTIES.map(item => {
          const active = item.id === difficulty;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{selected: active, disabled}}
              disabled={disabled}
              onPress={() => onSelectDifficulty(item.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.accent : colors.surfaceDeep,
                  borderColor: colors.border,
                  borderRadius: radius.pill,
                },
                disabled && styles.dimmed,
              ]}>
              <Text
                style={[
                  typography.caption,
                  {
                    color: active ? colors.accentText : colors.textSoft,
                    fontWeight: '700',
                  },
                ]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <PrimaryButton
        disabled={disabled}
        label="Shuffle"
        onPress={onShuffle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  moves: {
    fontVariant: ['tabular-nums'],
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dimmed: {
    opacity: 0.5,
  },
});
