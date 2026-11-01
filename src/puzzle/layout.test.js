import {createPuzzle} from './board';
import {
  cellCenter,
  cellOrigin,
  createLayout,
  positionAtPoint,
  tileImageOffset,
  tileAtPosition,
  toBoardPoint,
} from './layout';
import {TILE_GAP_PX} from './motionConfig';

test('createLayout rounds to whole pixels and fits the grid', () => {
  const layout = createLayout(300, 3);
  const totalGap = TILE_GAP_PX * (3 - 1);
  expect(layout.cell).toBe(Math.floor((300 - totalGap) / 3));
  expect(layout.boardPx).toBe(layout.cell * 3 + 2 * layout.gap);
  expect(layout.imagePx).toBe(layout.boardPx);
});

test('cellOrigin and cellCenter follow row-major positions', () => {
  const layout = createLayout(320, 4);
  expect(cellOrigin(0, layout)).toEqual({x: 0, y: 0});
  expect(cellOrigin(1, layout)).toEqual({x: layout.step, y: 0});
  const center = cellCenter(5, layout);
  const origin = cellOrigin(5, layout);
  expect(center.x).toBe(origin.x + layout.cell / 2);
});

test('positionAtPoint hits cells and rejects gaps and outside', () => {
  const layout = createLayout(300, 3);
  const mid = cellCenter(4, layout);
  expect(positionAtPoint(mid.x, mid.y, layout)).toBe(4);
  expect(positionAtPoint(-1, 0, layout)).toBeNull();
  expect(positionAtPoint(layout.boardPx, 0, layout)).toBeNull();
  const gapX = layout.cell + layout.gap / 2;
  expect(positionAtPoint(gapX, mid.y, layout)).toBeNull();
});

test('tileImageOffset depends only on origin', () => {
  const layout = createLayout(300, 3);
  const a = tileImageOffset(4, 3, layout);
  const b = tileImageOffset(4, 3, layout);
  expect(a).toEqual(b);
  expect(a.left).toBe(-layout.step);
  expect(a.top).toBe(-layout.step);
});

test('solved board offsets align adjacent tiles', () => {
  const layout = createLayout(303, 3);
  const rightOfOrigin0 = tileImageOffset(0, 3, layout);
  const origin1 = tileImageOffset(1, 3, layout);
  expect(Math.abs(origin1.left - rightOfOrigin0.left)).toBe(layout.step);
});

test('toBoardPoint subtracts window origin', () => {
  expect(toBoardPoint({pageX: 120, pageY: 80}, {x: 20, y: 30})).toEqual({
    x: 100,
    y: 50,
  });
  expect(() => toBoardPoint({pageX: 1, pageY: 1}, null)).toThrow(
    /Board window origin/,
  );
});

test('tileAtPosition finds the tile occupying a cell', () => {
  const board = createPuzzle(3, () => 0.2);
  const tile = tileAtPosition(board, board.tiles[0].position);
  expect(tile).toBeTruthy();
});
