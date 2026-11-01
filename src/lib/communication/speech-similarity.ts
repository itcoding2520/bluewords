function normalizeSpeechText(value: string) {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}' ]/gu, " ").replace(/\s+/g, " ").trim();
}

export function getSpeechSimilarity(expected: string, actual: string) {
  const expectedWords = normalizeSpeechText(expected).split(" ").filter(Boolean);
  const actualWords = normalizeSpeechText(actual).split(" ").filter(Boolean);
  if (!expectedWords.length || !actualWords.length) return 0;

  const distances = Array.from({ length: actualWords.length + 1 }, (_, index) => index);
  for (let expectedIndex = 1; expectedIndex <= expectedWords.length; expectedIndex += 1) {
    let diagonal = distances[0];
    distances[0] = expectedIndex;

    for (let actualIndex = 1; actualIndex <= actualWords.length; actualIndex += 1) {
      const above = distances[actualIndex];
      const substitutionCost = expectedWords[expectedIndex - 1] === actualWords[actualIndex - 1] ? 0 : 1;
      distances[actualIndex] = Math.min(
        distances[actualIndex] + 1,
        distances[actualIndex - 1] + 1,
        diagonal + substitutionCost,
      );
      diagonal = above;
    }
  }

  const longestLength = Math.max(expectedWords.length, actualWords.length);
  return Math.max(0, Math.round((1 - distances[actualWords.length] / longestLength) * 100));
}
