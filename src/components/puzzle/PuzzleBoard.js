import {forwardRef, useCallback, useImperativeHandle, useRef} from 'react';
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
    boardPadding = 10,
    tileRadius,
  },
  ref,
) {
  const {colors} = useTheme();
  const gridRef = useRef(null);

  const effectiveTileRadius =
    tileRadius ?? (layout.size === 5 ? 6 : layout.size === 4 ? 8 : 10);

  useImperativeHandle(
    ref,
    () => ({
      measureInWindow: cb => {
        if (
          gridRef.current &&
          typeof gridRef.current.measureInWindow === 'function' &&
          !gridRef.current.measureInWindow._isMockFunction
        ) {
          gridRef.current.measureInWindow(cb);
        } else {
          cb(0, 0);
        }
      },
    }),
    [],
  );

  const handleA11y = useCallback(
    tileId => {
      if (onAccessibilityActivate) {
        onAccessibilityActivate(tileId);
      }
    },
    [onAccessibilityActivate],
  );

  const outerSize = layout.boardPx + boardPadding * 2;

  return (
    <View
      collapsable={false}
      {...panHandlers}
      style={[
        styles.outerContainer,
        {
          width: outerSize,
          height: outerSize,
          padding: boardPadding,
          backgroundColor: colors.surfaceDeep,
          borderColor: colors.border,
        },
      ]}>
      <View
        ref={gridRef}
        collapsable={false}
        style={[
          styles.innerGrid,
          {
            width: layout.boardPx,
            height: layout.boardPx,
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
              borderRadius: effectiveTileRadius,
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
            tileRadius={effectiveTileRadius}
          />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  outerContainer: {
    alignSelf: 'center',
    borderRadius: 22,
    borderWidth: 1.5,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  innerGrid: {
    overflow: 'visible',
    position: 'relative',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 16,
    zIndex: 30,
  },
});
