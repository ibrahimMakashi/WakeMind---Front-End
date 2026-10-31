import React, {memo, useMemo} from 'react';
import {Animated, Image, StyleSheet, View} from 'react-native';
import {tileImageOffset} from '../../puzzle/layout';
import {tileAccessibilityLabel} from '../../puzzle/accessibility';
import {HOVER_BORDER_WIDTH} from '../../puzzle/motionConfig';
import {useTheme} from '../../theme/ThemeProvider';

const SAMPLE_IMAGE = require('../../assets/puzzle/sample.png');

function PuzzleTileComponent({
  tile,
  layout,
  motion,
  selected,
  hovered,
  dragging,
  locked,
  onAccessibilityActivate,
}) {
  const {colors} = useTheme();
  const imageStyle = tileImageOffset(tile.origin, layout.size, layout);

  // Compute the Animated.add nodes once per motion object.
  // Since motion is stable (same ref for the lifetime of a tile), these nodes
  // are created exactly once and never replaced. The native driver stays
  // attached continuously — including the very first movement frame after grab.
  const translateX = useMemo(
    () => Animated.add(motion.position.x, motion.drag.x),
    [motion],
  );
  const translateY = useMemo(
    () => Animated.add(motion.position.y, motion.drag.y),
    [motion],
  );

  const showHighlight = selected || hovered;

  return (
    <Animated.View
      accessibilityRole="button"
      accessibilityLabel={tileAccessibilityLabel(tile, layout.size, selected)}
      accessibilityState={{selected, disabled: locked}}
      accessible
      onAccessibilityTap={locked ? undefined : onAccessibilityActivate}
      pointerEvents="none"
      style={[
        styles.tile,
        {
          width: layout.cell,
          height: layout.cell,
          zIndex: dragging ? 20 : showHighlight ? 8 : 1,
          elevation: dragging ? 8 : showHighlight ? 4 : 0,
        },
        {
          transform: [
            {translateX},
            {translateY},
            {scale: motion.scale},
          ],
        },
      ]}>
      <View style={styles.clip}>
        <Image
          fadeDuration={0}
          source={SAMPLE_IMAGE}
          style={[
            styles.image,
            {
              width: imageStyle.width,
              height: imageStyle.height,
              left: imageStyle.left,
              top: imageStyle.top,
            },
          ]}
        />
      </View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.overlay,
          {
            borderColor: colors.accent,
            borderWidth: HOVER_BORDER_WIDTH,
            opacity: motion.overlay,
            shadowColor: colors.accent,
          },
          showHighlight && !dragging ? styles.hoverVisible : null,
        ]}
      />
      {showHighlight && !dragging ? (
        <View
          pointerEvents="none"
          style={[styles.hoverRing, {borderColor: colors.accent}]}
        />
      ) : null}
    </Animated.View>
  );
}

function propsEqual(prev, next) {
  return (
    prev.tile.id === next.tile.id &&
    prev.tile.origin === next.tile.origin &&
    prev.selected === next.selected &&
    prev.hovered === next.hovered &&
    prev.dragging === next.dragging &&
    prev.locked === next.locked &&
    prev.layout.cell === next.layout.cell &&
    prev.layout.size === next.layout.size &&
    prev.motion === next.motion
  );
}

export const PuzzleTile = memo(PuzzleTileComponent, propsEqual);

const styles = StyleSheet.create({
  tile: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
  clip: {
    flex: 1,
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 6,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  hoverRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 6,
    borderWidth: 1,
    opacity: 0.45,
  },
  hoverVisible: {
    opacity: 0.35,
  },
});
