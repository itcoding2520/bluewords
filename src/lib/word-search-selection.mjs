/** @typedef {{ row: number; column: number }} WordSearchCell */
/** @typedef {{ id: string; word: string; normalized: string; cells: WordSearchCell[] }} PlacedWord */
/** @typedef {{ size: number; letters: string[][]; words: PlacedWord[] }} WordSearchPuzzle */

/**
 * Return the cells from first to last when the selection is a permitted
 * forward line. Invalid and backward selections return null.
 *
 * @param {WordSearchCell} first
 * @param {WordSearchCell} last
 * @returns {WordSearchCell[] | null}
 */
export function getWordSearchSelectionPath(first, last) {
  const rowDelta = last.row - first.row;
  const columnDelta = last.column - first.column;
  if (rowDelta === 0 && columnDelta <= 0) return null;
  if (columnDelta === 0 && rowDelta <= 0) return null;
  if (rowDelta !== 0 && columnDelta !== 0 && (rowDelta <= 0 || Math.abs(rowDelta) !== Math.abs(columnDelta))) return null;

  const length = Math.max(Math.abs(rowDelta), Math.abs(columnDelta)) + 1;
  if (length < 2) return null;
  const rowStep = Math.sign(rowDelta);
  const columnStep = Math.sign(columnDelta);

  return Array.from({ length }, (_, index) => ({
    row: first.row + rowStep * index,
    column: first.column + columnStep * index,
  }));
}

/**
 * @param {WordSearchPuzzle} puzzle
 * @param {WordSearchCell} first
 * @param {WordSearchCell} last
 * @returns {PlacedWord | null}
 */
export function findWordSearchSelection(puzzle, first, last) {
  const path = getWordSearchSelectionPath(first, last);
  if (!path) return null;
  const selected = path.map(({ row, column }) => puzzle.letters[row]?.[column] ?? "").join("");
  return puzzle.words.find((word) => word.normalized === selected) ?? null;
}

/**
 * Match a sequence of individually selected cells against any word using
 * the permitted forward directions, regardless of its original placement.
 *
 * @param {WordSearchPuzzle} puzzle
 * @param {WordSearchCell[]} cells
 * @param {Set<string>} [excludedIds]
 * @returns {{ word: PlacedWord; complete: boolean } | null}
 */
export function findWordSearchSelectionPrefix(puzzle, cells, excludedIds = new Set()) {
  if (cells.length === 0) return null;
  if (cells.length > 1) {
    const path = getWordSearchSelectionPath(cells[0], cells.at(-1));
    if (!path || path.length !== cells.length || !path.every(({ row, column }, index) => row === cells[index].row && column === cells[index].column)) return null;
  }

  const selected = cells.map(({ row, column }) => puzzle.letters[row]?.[column] ?? "").join("");
  if (!selected || selected.length !== cells.length) return null;

  const remainingWords = puzzle.words.filter((candidate) => !excludedIds.has(candidate.id));
  const completeWord = remainingWords.find((candidate) => candidate.normalized === selected);
  if (completeWord) return { word: completeWord, complete: true };

  const word = remainingWords.find((candidate) => candidate.normalized.startsWith(selected));
  return word ? { word, complete: false } : null;
}
