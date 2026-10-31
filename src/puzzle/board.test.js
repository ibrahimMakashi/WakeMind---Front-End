import {GRID_SIZES} from './constants';
import {
  chooseTile,
  createPuzzle,
  createPuzzleForDifficulty,
  createSolvedBoard,
  getTilesInPositionOrder,
  gridSizeForDifficulty,
  isSolved,
  resetPuzzle,
  shuffleBoard,
} from './board';

function scriptedRandom(values) {
  let index = 0;
  return () => {
    const value = values[index];
    index += 1;
    return value;
  };
}

function identityRandom() {
  return 0.999;
}

function positionsByOrigin(board) {
  const positions = [];
  board.tiles.forEach(tile => {
    positions[tile.origin] = tile.position;
  });
  return positions;
}

function snapshotTiles(board) {
  return board.tiles.map(tile => ({
    id: tile.id,
    origin: tile.origin,
    position: tile.position,
  }));
}

function restoreBySwaps(board) {
  let current = board;
  let guard = 0;
  while (!isSolved(current) && guard < current.tiles.length) {
    const misplaced = getTilesInPositionOrder(current).find(
      tile => tile.position !== tile.origin,
    );
    const owner = current.tiles.find(tile => tile.origin === misplaced.position);
    const selected = chooseTile(current, misplaced.id);
    const swapped = chooseTile(selected.board, owner.id);
    if (!swapped.accepted) {
      throw new Error('Expected a valid swap while restoring the board.');
    }
    current = swapped.board;
    guard += 1;
  }
  return current;
}

test('builds solved boards for 3×3, 4×4, and 5×5', () => {
  [3, 4, 5].forEach(size => {
    const board = createSolvedBoard(size);
    expect(board.size).toBe(size);
    expect(board.tiles).toHaveLength(size * size);
    expect(board.selectedId).toBeNull();
    expect(board.moveCount).toBe(0);
    expect(isSolved(board)).toBe(true);

    const ids = board.tiles.map(tile => tile.id);
    expect(new Set(ids).size).toBe(ids.length);
    board.tiles.forEach((tile, index) => {
      expect(tile.id).toBe(`tile-${index}`);
      expect(tile.origin).toBe(index);
      expect(tile.position).toBe(index);
    });
  });
});

test('maps each difficulty to its grid size', () => {
  expect(gridSizeForDifficulty('easy')).toBe(GRID_SIZES.easy);
  expect(gridSizeForDifficulty('medium')).toBe(4);
  expect(gridSizeForDifficulty('hard')).toBe(5);
  expect(createPuzzleForDifficulty('medium', identityRandom).size).toBe(4);
  expect(() => gridSizeForDifficulty('expert')).toThrow(/Unknown puzzle difficulty/);
  expect(() => createSolvedBoard(2)).toThrow(/Puzzle size must be 3, 4, or 5/);
});

test('a fixed random stream swaps the first and last tiles', () => {
  const draws = [0, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999];
  const solved = createSolvedBoard(3);
  const before = snapshotTiles(solved);
  const board = shuffleBoard(solved, scriptedRandom(draws));

  expect(positionsByOrigin(board)).toEqual([8, 1, 2, 3, 4, 5, 6, 7, 0]);
  expect(isSolved(board)).toBe(false);
  expect(board.moveCount).toBe(0);
  expect(board.selectedId).toBeNull();
  expect(snapshotTiles(solved)).toEqual(before);
});

test('a solved shuffle is replaced with a swap of the first two tiles', () => {
  const board = createPuzzle(3, identityRandom);
  expect(positionsByOrigin(board)).toEqual([1, 0, 2, 3, 4, 5, 6, 7, 8]);
  expect(isSolved(board)).toBe(false);
});

test('shuffling keeps every tile once', () => {
  const board = createPuzzle(5, () => 0.25);
  const ids = new Set(board.tiles.map(tile => tile.id));
  const origins = board.tiles.map(tile => tile.origin).sort((left, right) => left - right);
  const positions = board.tiles.map(tile => tile.position).sort((left, right) => left - right);
  const expected = Array.from({length: 25}, (_, index) => index);

  expect(ids).toEqual(new Set(expected.map(index => `tile-${index}`)));
  expect(origins).toEqual(expected);
  expect(positions).toEqual(expected);
  expect(new Set(board.tiles.map(tile => tile.id)).size).toBe(25);
});

test('swapping two tiles exchanges their positions and counts one move', () => {
  const solved = createSolvedBoard(3);
  const selected = chooseTile(solved, 'tile-0');
  expect(selected.accepted).toBe(false);
  expect(selected.reason).toBe('selected');
  expect(selected.board.moveCount).toBe(0);
  expect(solved.selectedId).toBeNull();

  const swapped = chooseTile(selected.board, 'tile-4');
  expect(swapped.accepted).toBe(true);
  expect(swapped.reason).toBe('swapped');
  expect(swapped.board.moveCount).toBe(1);
  expect(swapped.board.selectedId).toBeNull();
  expect(positionsByOrigin(swapped.board)).toEqual([4, 1, 2, 3, 0, 5, 6, 7, 8]);
  expect(isSolved(swapped.board)).toBe(false);
  expect(positionsByOrigin(solved)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);

  const restored = chooseTile(chooseTile(swapped.board, 'tile-0').board, 'tile-4');
  expect(restored.accepted).toBe(true);
  expect(restored.board.moveCount).toBe(2);
  expect(isSolved(restored.board)).toBe(true);
});

test('invalid selections do not change the board or the move count', () => {
  const solved = createSolvedBoard(4);
  const selected = chooseTile(solved, 'tile-2');
  const missing = chooseTile(selected.board, 'tile-missing');
  const same = chooseTile(selected.board, 'tile-2');

  expect(missing.accepted).toBe(false);
  expect(missing.reason).toBe('invalid');
  expect(missing.board).toBe(selected.board);
  expect(missing.board.moveCount).toBe(0);

  expect(same.accepted).toBe(false);
  expect(same.reason).toBe('deselected');
  expect(same.board.moveCount).toBe(0);
  expect(same.board.selectedId).toBeNull();
  expect(positionsByOrigin(same.board)).toEqual(positionsByOrigin(solved));
  expect(positionsByOrigin(solved)).toEqual(
    Array.from({length: 16}, (_, index) => index),
  );
});

test('orders tiles by current position without changing the board', () => {
  const board = createPuzzle(
    3,
    scriptedRandom([0, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999]),
  );
  const before = snapshotTiles(board);
  const tileArray = board.tiles;

  const ordered = getTilesInPositionOrder(board);

  expect(ordered).not.toBe(board.tiles);
  expect(ordered.map(tile => tile.position)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  expect(ordered[0].id).toBe('tile-8');
  expect(ordered[8].id).toBe('tile-0');
  expect(board.tiles).toBe(tileArray);
  expect(snapshotTiles(board)).toEqual(before);
  ordered.pop();
  expect(board.tiles).toHaveLength(9);
});

test('valid swaps can restore a shuffled board to solved', () => {
  const shuffled = createPuzzle(4, () => 0.2);
  expect(isSolved(shuffled)).toBe(false);
  const before = snapshotTiles(shuffled);

  const solved = restoreBySwaps(shuffled);

  expect(isSolved(solved)).toBe(true);
  expect(solved.moveCount).toBeGreaterThan(0);
  expect(snapshotTiles(shuffled)).toEqual(before);
  solved.tiles.forEach(tile => {
    expect(tile.position).toBe(tile.origin);
  });
});

test('reset returns a fresh board and leaves the previous one alone', () => {
  const board = createPuzzle(
    3,
    scriptedRandom([0, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999]),
  );
  const before = snapshotTiles(board);
  const next = resetPuzzle(board, identityRandom);

  expect(next).not.toBe(board);
  expect(next.size).toBe(3);
  expect(next.tiles).toHaveLength(9);
  expect(next.moveCount).toBe(0);
  expect(next.selectedId).toBeNull();
  expect(isSolved(next)).toBe(false);
  expect(positionsByOrigin(next)).toEqual([1, 0, 2, 3, 4, 5, 6, 7, 8]);
  expect(snapshotTiles(board)).toEqual(before);
});

test('completing one board does not change another board', () => {
  const first = createPuzzle(3, identityRandom);
  const second = createPuzzle(5, () => 0.3);
  const secondTiles = snapshotTiles(second);
  const secondMoves = second.moveCount;

  const completed = restoreBySwaps(first);

  expect(isSolved(completed)).toBe(true);
  expect(isSolved(first)).toBe(false);
  expect(snapshotTiles(second)).toEqual(secondTiles);
  expect(second.moveCount).toBe(secondMoves);
  expect(second.selectedId).toBeNull();
});
