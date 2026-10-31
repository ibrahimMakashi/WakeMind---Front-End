import React from 'react';
import {act, create} from 'react-test-renderer';
import {Animated, Image} from 'react-native';
import {ThemeProvider, useTheme} from '../../theme/ThemeProvider';
import {PuzzleTile} from './PuzzleTile';
import {createLayout, tileImageOffset} from '../../puzzle/layout';
import {createSolvedBoard} from '../../puzzle/board';
import {dropTile, tapTile} from '../../puzzle/session';

jest.mock('../../assets/puzzle/sample.png', () => 1);
jest.mock('@react-native-vector-icons/material-design-icons', () => 'MaterialDesignIcons');

function createMotion() {
  return {
    position: new Animated.ValueXY({x: 0, y: 0}),
    drag: new Animated.ValueXY({x: 0, y: 0}),
    scale: new Animated.Value(1),
    overlay: new Animated.Value(0),
  };
}

function ReadyTile(props) {
  const theme = useTheme();
  if (!theme.ready) {
    return null;
  }
  return <PuzzleTile {...props} />;
}

async function renderTile(tile) {
  const layout = createLayout(300, 3);
  const motion = createMotion();
  let renderer;
  await act(async () => {
    renderer = create(
      <ThemeProvider loadThemeMode={async () => 'dark'}>
        <ReadyTile
          dragging={false}
          hovered={false}
          layout={layout}
          locked={false}
          motion={motion}
          onAccessibilityActivate={() => {}}
          selected={false}
          tile={tile}
        />
      </ThemeProvider>,
    );
  });
  return {renderer, layout};
}

test('tile image offset depends on origin only after swap', async () => {
  let board = createSolvedBoard(3);
  board = tapTile(board, 'tile-0').board;
  const swapped = tapTile(board, 'tile-1').board;
  const tile0 = swapped.tiles.find(t => t.id === 'tile-0');
  const offsetBefore = tileImageOffset(tile0.origin, 3, createLayout(300, 3));
  expect(tile0.position).not.toBe(tile0.origin);

  const {renderer, layout} = await renderTile(tile0);
  const image = renderer.root.findByType(Image);
  const flatStyle = Object.assign({}, ...[].concat(image.props.style));
  expect(flatStyle.left).toBe(offsetBefore.left);
  expect(flatStyle.top).toBe(offsetBefore.top);
  expect(flatStyle).toEqual(
    expect.objectContaining({
      width: layout.size * layout.cell + (layout.size - 1) * layout.gap,
    }),
  );
});

test('drag-drop swap exchanges positions in engine', () => {
  const board = createSolvedBoard(3);
  const dragId = 'tile-0';
  const targetId = 'tile-8';
  const before = {
    ...board,
    tiles: board.tiles.map(t => ({...t})),
  };
  const result = dropTile(before, dragId, targetId);
  expect(result.accepted).toBe(true);
  const fromDrag = before.tiles.find(t => t.id === dragId).position;
  const fromTarget = before.tiles.find(t => t.id === targetId).position;
  const afterDrag = result.board.tiles.find(t => t.id === dragId).position;
  const afterTarget = result.board.tiles.find(t => t.id === targetId).position;
  expect(afterDrag).toBe(fromTarget);
  expect(afterTarget).toBe(fromDrag);
});
