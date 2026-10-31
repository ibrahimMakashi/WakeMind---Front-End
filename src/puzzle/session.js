import {chooseTile, shuffleBoard} from './board';

/**
 * @typedef {import('./board').TileChoice & {kind: 'tap'|'drop'|'shuffle'}} SessionResult
 */

/**
 * @param {import('./board').PuzzleBoard} board
 * @param {string} tileId
 * @returns {SessionResult}
 */
export function tapTile(board, tileId) {
  const result = chooseTile(board, tileId);
  return {...result, kind: 'tap'};
}

/**
 * Drag-drop swap: same engine path as tap-select then tap-target.
 *
 * @param {import('./board').PuzzleBoard} board
 * @param {string} dragId
 * @param {string} targetId
 * @returns {SessionResult}
 */
export function dropTile(board, dragId, targetId) {
  if (dragId === targetId) {
    return {board, accepted: false, reason: 'invalid', kind: 'drop'};
  }

  let current = board;
  if (current.selectedId) {
    const clear = chooseTile(current, current.selectedId);
    current = clear.board;
  }

  const first = chooseTile(current, dragId);
  const second = chooseTile(first.board, targetId);
  return {...second, kind: 'drop'};
}

/**
 * @param {import('./board').PuzzleBoard} board
 * @param {() => number} [random]
 * @returns {import('./board').PuzzleBoard}
 */
export function shuffleSession(board, random) {
  return shuffleBoard(board, random);
}
