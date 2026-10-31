import {GRID_SIZES, SUPPORTED_GRID_SIZES} from './constants';

/**
 * A tile keeps a stable id and its original index. `position` is the
 * row-major cell it currently occupies (`row * size + column`).
 *
 * @typedef {Object} PuzzleTile
 * @property {string} id
 * @property {number} origin
 * @property {number} position
 *
 * @typedef {Object} PuzzleBoard
 * @property {number} size
 * @property {PuzzleTile[]} tiles
 * @property {string|null} selectedId
 * @property {number} moveCount
 *
 * @typedef {Object} TileChoice
 * @property {PuzzleBoard} board
 * @property {boolean} accepted true only when two distinct tiles were swapped
 * @property {'selected'|'deselected'|'swapped'|'invalid'} reason
 */

/**
 * @param {string} difficulty `easy`, `medium`, or `hard`
 * @returns {number} grid side length
 */
export function gridSizeForDifficulty(difficulty) {
  const size = GRID_SIZES[difficulty];
  if (!size) {
    throw new Error(`Unknown puzzle difficulty: ${difficulty}`);
  }
  return size;
}

/**
 * @param {number} size 3, 4, or 5
 * @returns {PuzzleBoard} solved board; every tile's position matches its origin
 */
export function createSolvedBoard(size) {
  assertSupportedSize(size);
  const count = size * size;
  const tiles = [];
  for (let index = 0; index < count; index += 1) {
    tiles.push({
      id: `tile-${index}`,
      origin: index,
      position: index,
    });
  }
  return {
    size,
    tiles,
    selectedId: null,
    moveCount: 0,
  };
}

/**
 * @param {number} size 3, 4, or 5
 * @param {() => number} [random] returns a number in [0, 1), like Math.random
 * @returns {PuzzleBoard} a new unsolved board
 */
export function createPuzzle(size, random = Math.random) {
  return shuffleBoard(createSolvedBoard(size), random);
}

/**
 * @param {string} difficulty
 * @param {() => number} [random]
 * @returns {PuzzleBoard}
 */
export function createPuzzleForDifficulty(difficulty, random = Math.random) {
  return createPuzzle(gridSizeForDifficulty(difficulty), random);
}

/**
 * @param {PuzzleBoard} board
 * @param {() => number} [random] returns a number in [0, 1)
 * @returns {PuzzleBoard} new unsolved board; the input board is not changed
 */
export function shuffleBoard(board, random = Math.random) {
  const assigned = permutePositions(board.size * board.size, random);
  return {
    size: board.size,
    tiles: board.tiles.map(tile => ({
      id: tile.id,
      origin: tile.origin,
      position: assigned[tile.origin],
    })),
    selectedId: null,
    moveCount: 0,
  };
}

/**
 * Fresh unsolved arrangement of the same size. Does not change `board`.
 *
 * @param {PuzzleBoard} board
 * @param {() => number} [random]
 * @returns {PuzzleBoard}
 */
export function resetPuzzle(board, random = Math.random) {
  return shuffleBoard(board, random);
}

/**
 * Select a tile, or swap it with the tile already selected.
 * A selection or a cancelled selection is not a move.
 * An unknown id is ignored.
 *
 * @param {PuzzleBoard} board
 * @param {string} tileId
 * @returns {TileChoice}
 */
export function chooseTile(board, tileId) {
  const tile = board.tiles.find(item => item.id === tileId);
  if (!tile) {
    return {board, accepted: false, reason: 'invalid'};
  }
  if (!board.selectedId) {
    return {
      board: copyBoard(board, {selectedId: tile.id}),
      accepted: false,
      reason: 'selected',
    };
  }
  if (board.selectedId === tile.id) {
    return {
      board: copyBoard(board, {selectedId: null}),
      accepted: false,
      reason: 'deselected',
    };
  }
  const selected = board.tiles.find(item => item.id === board.selectedId);
  if (!selected) {
    return {board, accepted: false, reason: 'invalid'};
  }
  const tiles = board.tiles.map(item => {
    if (item.id === selected.id) {
      return {...item, position: tile.position};
    }
    if (item.id === tile.id) {
      return {...item, position: selected.position};
    }
    return item;
  });
  return {
    board: {
      size: board.size,
      tiles,
      selectedId: null,
      moveCount: board.moveCount + 1,
    },
    accepted: true,
    reason: 'swapped',
  };
}

/**
 * @param {PuzzleBoard} board
 * @returns {boolean}
 */
export function isSolved(board) {
  return board.tiles.every(tile => tile.position === tile.origin);
}

/**
 * Tiles ordered by the cell they currently occupy.
 * The returned array is new. Tile objects are not copied or changed.
 *
 * @param {PuzzleBoard} board
 * @returns {PuzzleTile[]}
 */
export function getTilesInPositionOrder(board) {
  return board.tiles.slice().sort((left, right) => left.position - right.position);
}

function copyBoard(board, changes) {
  return {
    size: board.size,
    tiles: board.tiles.slice(),
    selectedId: board.selectedId,
    moveCount: board.moveCount,
    ...changes,
  };
}

function assertSupportedSize(size) {
  if (!SUPPORTED_GRID_SIZES.includes(size)) {
    throw new Error('Puzzle size must be 3, 4, or 5.');
  }
}

/**
 * Fisher-Yates over origin indexes. `assigned[origin]` is that tile's position.
 * A solved draw is turned into a swap of the first two tiles.
 *
 * @param {number} count
 * @param {() => number} random
 * @returns {number[]}
 */
function permutePositions(count, random) {
  const assigned = [];
  for (let index = 0; index < count; index += 1) {
    assigned.push(index);
  }
  for (let index = count - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = assigned[index];
    assigned[index] = assigned[swapIndex];
    assigned[swapIndex] = current;
  }
  if (assigned.every((position, index) => position === index)) {
    const first = assigned[0];
    assigned[0] = assigned[1];
    assigned[1] = first;
  }
  return assigned;
}
