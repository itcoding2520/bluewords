/**
 * Normalizes quiz answers without depending on the user's browser locale.
 *
 * @param {string} value
 * @returns {string}
 */
export function normalizeQuizAnswer(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
