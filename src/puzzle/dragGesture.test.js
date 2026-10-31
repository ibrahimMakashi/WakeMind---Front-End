import {createSolvedBoard} from './board';
import {classifyRelease, tileIdAtBoardPoint} from './dragGesture';
import {cellCenter, cellOrigin, createLayout, toBoardPoint} from './layout';
import {TAP_SLOP_PX} from './motionConfig';

test('classifyRelease treats small movement as tap', () => {
  const board = createSolvedBoard(3);
  const layout = createLayout(300, 3);
  const start = cellCenter(0, layout);
  const end = {x: start.x + 2, y: start.y + 2};
  expect(
    classifyRelease({
      tileId: 'tile-0',
      start,
      end,
      board,
      layout,
      tapSlop: TAP_SLOP_PX,
    }).kind,
  ).toBe('tap');
});

test('classifyRelease drops on another tile', () => {
  const board = createSolvedBoard(3);
  const layout = createLayout(300, 3);
  const start = cellCenter(0, layout);
  const end = cellCenter(8, layout);
  const result = classifyRelease({
    tileId: 'tile-0',
    start,
    end,
    board,
    layout,
    tapSlop: TAP_SLOP_PX,
  });
  expect(result.kind).toBe('drop');
  expect(result.targetTileId).toBe('tile-8');
});

test('classifyRelease returns when dropped outside or on self', () => {
  const board = createSolvedBoard(3);
  const layout = createLayout(300, 3);
  const start = cellCenter(0, layout);
  expect(
    classifyRelease({
      tileId: 'tile-0',
      start,
      end: {x: -10, y: -10},
      board,
      layout,
      tapSlop: TAP_SLOP_PX,
    }).kind,
  ).toBe('return');
  const origin = cellOrigin(0, layout);
  const farCorner = {
    x: origin.x + layout.cell - 1,
    y: origin.y + layout.cell - 1,
  };
  expect(
    classifyRelease({
      tileId: 'tile-0',
      start: origin,
      end: farCorner,
      board,
      layout,
      tapSlop: TAP_SLOP_PX,
    }).kind,
  ).toBe('return');
});

test('tileIdAtBoardPoint uses page coordinates via toBoardPoint', () => {
  const board = createSolvedBoard(3);
  const layout = createLayout(300, 3);
  const centre = cellCenter(5, layout);
  const windowOrigin = {x: 50, y: 100};
  const boardPoint = toBoardPoint(
    {pageX: windowOrigin.x + centre.x, pageY: windowOrigin.y + centre.y},
    windowOrigin,
  );
  expect(tileIdAtBoardPoint(boardPoint, board, layout)).toBe('tile-5');
});
