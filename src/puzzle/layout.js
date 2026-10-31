import {TILE_GAP_PX} from './motionConfig';

/**
 * @typedef {Object} BoardLayout
 * @property {number} boardPx outer square size in pixels
 * @property {number} size grid side (3, 4, or 5)
 * @property {number} gap gap between cells
 * @property {number} cell cell width and height
 * @property {number} step cell + gap
 * @property {number} imagePx full artwork side at board scale
 */

/**
 * @param {number} boardPx
 * @param {number} size
 * @param {number} [gap]
 * @returns {BoardLayout}
 */
export function createLayout(boardPx, size, gap = TILE_GAP_PX) {
  const outer = Math.round(boardPx);
  const g = Math.round(gap);
  const cell = Math.floor((outer - g * (size - 1)) / size);
  const step = cell + g;
  const imagePx = size * cell + (size - 1) * g;
  return {
    boardPx: cell * size + g * (size - 1),
    size,
    gap: g,
    cell,
    step,
    imagePx,
  };
}

/**
 * Top-left of a cell in board coordinates.
 *
 * @param {number} position row-major cell index
 * @param {BoardLayout} layout
 */
export function cellOrigin(position, layout) {
  const row = Math.floor(position / layout.size);
  const col = position % layout.size;
  return {
    x: col * layout.step,
    y: row * layout.step,
  };
}

/**
 * Centre of a cell in board coordinates.
 *
 * @param {number} position
 * @param {BoardLayout} layout
 */
export function cellCenter(position, layout) {
  const origin = cellOrigin(position, layout);
  return {
    x: origin.x + layout.cell / 2,
    y: origin.y + layout.cell / 2,
  };
}

/**
 * Row-major cell index at a board-relative point, or null if outside.
 *
 * @param {number} x board-relative
 * @param {number} y board-relative
 * @param {BoardLayout} layout
 * @returns {number|null}
 */
export function positionAtPoint(x, y, layout) {
  if (x < 0 || y < 0 || x >= layout.boardPx || y >= layout.boardPx) {
    return null;
  }
  const col = Math.floor(x / layout.step);
  const row = Math.floor(y / layout.step);
  if (col >= layout.size || row >= layout.size) {
    return null;
  }
  const localX = x - col * layout.step;
  const localY = y - row * layout.step;
  if (localX >= layout.cell || localY >= layout.cell) {
    return null;
  }
  return row * layout.size + col;
}

/**
 * @param {{pageX: number, pageY: number}} point
 * @param {{x: number, y: number}|null|undefined} boardWindowOrigin
 * @returns {{x: number, y: number}}
 */
export function toBoardPoint(point, boardWindowOrigin) {
  if (
    !boardWindowOrigin ||
    !Number.isFinite(boardWindowOrigin.x) ||
    !Number.isFinite(boardWindowOrigin.y) ||
    !Number.isFinite(point.pageX) ||
    !Number.isFinite(point.pageY)
  ) {
    throw new Error('Board window origin is not available for touch conversion.');
  }
  return {
    x: point.pageX - boardWindowOrigin.x,
    y: point.pageY - boardWindowOrigin.y,
  };
}

/**
 * Image crop offset from the tile's stable origin only.
 *
 * @param {number} origin
 * @param {number} size grid side
 * @param {BoardLayout} layout
 */
export function tileImageOffset(origin, size, layout) {
  const originRow = Math.floor(origin / size);
  const originCol = origin % size;
  const step = layout.step;
  return {
    left: -originCol * step,
    top: -originRow * step,
    width: layout.imagePx,
    height: layout.imagePx,
  };
}

/**
 * @param {import('./board').PuzzleBoard} board
 * @param {number} position
 * @returns {import('./board').PuzzleTile|undefined}
 */
export function tileAtPosition(board, position) {
  return board.tiles.find(tile => tile.position === position);
}
