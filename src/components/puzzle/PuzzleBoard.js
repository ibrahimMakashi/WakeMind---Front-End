import {forwardRef, useCallback} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';
import {PuzzleTile} from './PuzzleTile';

export const PuzzleBoard = forwardRef(function PuzzleBoard(
  {
    board,
    layout,
    panHandlers,
    getMotion,
    selectedId,
    hoverId,
    draggingId,
    locked,
    onAccessibilityActivate,
    completionGlow,
  },
  ref,
) {
  const {colors} = useTheme();

  const handleA11y = useCallback(
    tileId => {
      if (onAccessibilityActivate) {
        onAccessibilityActivate(tileId);
      }
    },
    [onAccessibilityActivate],
  );

  return (
    <View
      ref={ref}
      collapsable={false}
      {...panHandlers}
      style={[
        styles.board,
        {
          width: layout.boardPx,
          height: layout.boardPx,
          backgroundColor: colors.surfaceDeep,
          borderColor: colors.border,
        },
      ]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            opacity: completionGlow,
            borderColor: colors.accent,
            shadowColor: colors.accent,
          },
        ]}
      />
      {board.tiles.map(tile => (
        <PuzzleTile
          key={tile.id}
          dragging={draggingId === tile.id}
          hovered={hoverId === tile.id}
          layout={layout}
          locked={locked}
          motion={getMotion(tile.id)}
          onAccessibilityActivate={() => handleA11y(tile.id)}
          selected={selectedId === tile.id}
          tile={tile}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  board: {
    alignSelf: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'visible',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 2,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
});
