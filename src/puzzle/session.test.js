import {createPuzzle, createSolvedBoard, shuffleBoard} from './board';
import {dropTile, shuffleSession, tapTile} from './session';

test('tapTile selects and swaps through chooseTile', () => {
  const board = createSolvedBoard(3);
  const selected = tapTile(board, 'tile-0');
  expect(selected.reason).toBe('selected');
  expect(selected.board.selectedId).toBe('tile-0');

  const swapped = tapTile(selected.board, 'tile-8');
  expect(swapped.accepted).toBe(true);
  expect(swapped.board.moveCount).toBe(1);
});

test('tap same tile deselects', () => {
  const board = createSolvedBoard(3);
  const selected = tapTile(board, 'tile-1');
  const deselected = tapTile(selected.board, 'tile-1');
  expect(deselected.reason).toBe('deselected');
  expect(deselected.board.selectedId).toBeNull();
});

test('dropTile matches double tap swap and clears stale selection', () => {
  const board = createSolvedBoard(3);
  const withSelection = tapTile(board, 'tile-2').board;
  expect(withSelection.selectedId).toBe('tile-2');

  const dropped = dropTile(withSelection, 'tile-0', 'tile-8');
  expect(dropped.accepted).toBe(true);
  expect(dropped.board.selectedId).toBeNull();

  const tapPath = tapTile(
    tapTile(createSolvedBoard(3), 'tile-0').board,
    'tile-8',
  );
  expect(tapPath.board.moveCount).toBe(dropped.board.moveCount);
  expect(
    tapPath.board.tiles.map(t => ({id: t.id, position: t.position})),
  ).toEqual(dropped.board.tiles.map(t => ({id: t.id, position: t.position})));
});

test('dropTile rejects same id', () => {
  const board = createSolvedBoard(3);
  const result = dropTile(board, 'tile-0', 'tile-0');
  expect(result.accepted).toBe(false);
});

test('shuffleSession equals shuffleBoard and does not mutate input', () => {
  const board = createSolvedBoard(4);
  const random = () => 0.15;
  const before = board.tiles.map(t => t.position);
  const shuffled = shuffleSession(board, random);
  expect(shuffled).toEqual(shuffleBoard(board, random));
  expect(board.tiles.map(t => t.position)).toEqual(before);
});

test('session does not mutate engine input on tap', () => {
  const board = createPuzzle(3, () => 0.3);
  const snapshot = JSON.stringify(board);
  tapTile(board, board.tiles[0].id);
  expect(JSON.stringify(board)).toBe(snapshot);
});
