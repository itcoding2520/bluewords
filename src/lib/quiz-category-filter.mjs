/**
 * @template {{ category: string }} T
 * @param {T[]} words
 * @param {string} category
 * @returns {T[]}
 */
export function filterQuizWordsByCategory(words, category) {
  if (category === "all") return words;
  return words.filter((word) => word.category === category);
}
