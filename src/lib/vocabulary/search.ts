export function createVocabularySearchMatcher(search: string) {
  const query = search.trim().toLocaleLowerCase();
  return (word: string, meaning: string) =>
    !query || `${word} ${meaning}`.toLocaleLowerCase().includes(query);
}
