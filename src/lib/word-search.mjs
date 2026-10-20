/** @typedef {{ id: string; word: string }} WordSearchSourceWord */
/** @typedef {{ row: number; column: number }} WordSearchCell */
/** @typedef {WordSearchSourceWord & { normalized: string; cells: WordSearchCell[] }} PlacedWord */
/** @typedef {{ size: number; letters: string[][]; words: PlacedWord[] }} WordSearchPuzzle */

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export function normalizeWordSearchWord(word) {
  return word
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

function shuffle(items, random) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

function randomIndex(random, upperBound) {
  return Math.floor(random() * upperBound);
}

/**
 * Build a word-search board with words placed left-to-right, top-to-bottom,
 * or diagonally downward in either direction. Words never run backwards.
 *
 * @param {WordSearchSourceWord[]} sourceWords
 * @param {number} size
 * @param {number} maxWords
 * @param {() => number} random
 * @returns {WordSearchPuzzle}
 */
export function createWordSearchPuzzle(sourceWords, size, maxWords, random = Math.random) {
  const wordsByNormalized = new Map();
  for (const source of sourceWords) {
    const normalized = normalizeWordSearchWord(source.word);
    if (normalized.length < 2 || normalized.length > size || wordsByNormalized.has(normalized)) continue;
    wordsByNormalized.set(normalized, { ...source, normalized });
  }

  const letters = Array.from({ length: size }, () => Array(size).fill(""));
  const placedWords = [];
  const candidates = shuffle([...wordsByNormalized.values()], random);

  for (const candidate of candidates) {
    if (placedWords.length >= maxWords) break;
    const directions = shuffle(DIRECTIONS, random);
    let placement = null;

    for (let attempt = 0; attempt < size * size * 4 && !placement; attempt += 1) {
      const [rowStep, columnStep] = directions[attempt % directions.length];
      const row = randomIndex(random, size);
      const column = randomIndex(random, size);
      const lastRow = row + rowStep * (candidate.normalized.length - 1);
      const lastColumn = column + columnStep * (candidate.normalized.length - 1);

      if (lastRow < 0 || lastRow >= size || lastColumn < 0 || lastColumn >= size) continue;

      const cells = Array.from({ length: candidate.normalized.length }, (_, index) => ({
        row: row + rowStep * index,
        column: column + columnStep * index,
      }));
      const fits = cells.every(({ row: cellRow, column: cellColumn }, index) => {
        const existing = letters[cellRow][cellColumn];
        return !existing || existing === candidate.normalized[index];
      });

      if (fits) placement = cells;
    }

    if (!placement) continue;
    placement.forEach(({ row, column }, index) => {
      letters[row][column] = candidate.normalized[index];
    });
    placedWords.push({ ...candidate, cells: placement });
  }

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      if (!letters[row][column]) letters[row][column] = alphabet[randomIndex(random, alphabet.length)];
    }
  }

  return { size, letters, words: placedWords };
}

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
 * Match a sequence of individually selected cells against a placed word.
 *
 * @param {WordSearchPuzzle} puzzle
 * @param {WordSearchCell[]} cells
 * @param {Set<string>} [excludedIds]
 * @returns {{ word: PlacedWord; complete: boolean } | null}
 */
export function findWordSearchSelectionPrefix(puzzle, cells, excludedIds = new Set()) {
  if (cells.length === 0) return null;
  const word = puzzle.words.find((candidate) =>
    !excludedIds.has(candidate.id)
    && cells.length <= candidate.cells.length
    && cells.every(({ row, column }, index) => candidate.cells[index].row === row && candidate.cells[index].column === column),
  );

  return word ? { word, complete: cells.length === word.cells.length } : null;
}
