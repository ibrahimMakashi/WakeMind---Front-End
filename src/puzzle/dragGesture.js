import {positionAtPoint, tileAtPosition} from './layout';

/**
 * @typedef {'tap'|'drop'|'return'} ReleaseKind
 *
 * @typedef {Object} ReleaseClassification
 * @property {ReleaseKind} kind
 * @property {string|null} targetTileId when kind is drop
 */

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Classify a pointer release after dragging `tileId`.
 *
 * @param {Object} params
 * @param {string} params.tileId dragged tile id
 * @param {{x: number, y: number}} params.start board-relative start
 * @param {{x: number, y: number}} params.end board-relative end (e.g. cell centre + dx/dy)
 * @param {import('./board').PuzzleBoard} params.board
 * @param {import('./layout').BoardLayout} params.layout
 * @param {number} params.tapSlop
 * @returns {ReleaseClassification}
 */
export function classifyRelease({tileId, start, end, board, layout, tapSlop}) {
  if (distance(start, end) < tapSlop) {
    return {kind: 'tap', targetTileId: null};
  }

  const cellIndex = positionAtPoint(end.x, end.y, layout);
  if (cellIndex == null) {
    return {kind: 'return', targetTileId: null};
  }

  const target = tileAtPosition(board, cellIndex);
  if (!target || target.id === tileId) {
    return {kind: 'return', targetTileId: null};
  }

  return {kind: 'drop', targetTileId: target.id};
}

/**
 * Resolve which tile was touched at a board-relative point.
 *
 * @param {{x: number, y: number}} boardPoint
 * @param {import('./board').PuzzleBoard} board
 * @param {import('./layout').BoardLayout} layout
 * @returns {string|null} tile id
 */
export function tileIdAtBoardPoint(boardPoint, board, layout) {
  const cellIndex = positionAtPoint(boardPoint.x, boardPoint.y, layout);
  if (cellIndex == null) {
    return null;
  }
  const tile = tileAtPosition(board, cellIndex);
  return tile ? tile.id : null;
}
