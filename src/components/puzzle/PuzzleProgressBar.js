import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import {spacing} from '../../constants/theme';
import {useTheme} from '../../theme/ThemeProvider';

export function PuzzleProgressBar({board, ready = true, style}) {
  const {colors, typography, radius} = useTheme();

  const total = board?.tiles?.length || 0;
  const correct = useMemo(() => {
    if (!board?.tiles || !Array.isArray(board.tiles)) {
      return 0;
    }
    return board.tiles.filter(t => t.position === t.origin).length;
  }, [board?.tiles]);

  const fraction = ready && total > 0 ? correct / total : 0;
  const percentage = Math.round(fraction * 100);

  const animValue = useRef(new Animated.Value(ready ? fraction : 0)).current;

  useEffect(() => {
    const target = ready ? fraction : 0;
    Animated.timing(animValue, {
      toValue: target,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [animValue, fraction, ready]);

  const widthInterpolation = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      accessibilityLabel={`Puzzle progress: ${ready ? correct : 0} of ${total} tiles placed, ${percentage}% complete`}
      accessibilityRole="progressbar"
      accessibilityValue={{
        max: total,
        min: 0,
        now: ready ? correct : 0,
      }}
      style={[styles.container, style]}>
      <View style={styles.headerRow}>
        <Text style={[typography.sectionLabel, styles.label, {color: colors.muted}]}>
          PUZZLE PROGRESS
        </Text>
        <View style={styles.statsRow}>
          <Text style={[typography.caption, styles.countText, {color: colors.textSoft}]}>
            {ready ? correct : 0} / {total} tiles placed
          </Text>
          <Text style={[typography.caption, styles.percentText, {color: colors.accent}]}>
            {percentage}%
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.track,
          {
            backgroundColor: colors.surfaceDeep,
            borderColor: colors.border,
            borderRadius: radius.pill,
          },
        ]}>
        <Animated.View
          style={[
            styles.bar,
            {
              backgroundColor: colors.accent,
              borderRadius: radius.pill,
              width: widthInterpolation,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    width: '100%',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  statsRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  countText: {
    fontSize: 11,
    marginRight: spacing.sm,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  track: {
    borderWidth: 1,
    height: 7,
    overflow: 'hidden',
    width: '100%',
  },
  bar: {
    height: '100%',
  },
});
