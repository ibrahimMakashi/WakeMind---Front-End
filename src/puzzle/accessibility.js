/**
 * @param {import('./board').PuzzleTile} tile
 * @param {number} size
 * @param {boolean} selected
 */
export function tileAccessibilityLabel(tile, size, selected) {
  const row = Math.floor(tile.origin / size) + 1;
  const col = (tile.origin % size) + 1;
  const base = `Tile ${tile.origin + 1}, row ${row} column ${col}`;
  if (selected) {
    return `${base}, selected`;
  }
  return base;
}
