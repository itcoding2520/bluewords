export function normalizeVocabularyKey(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeVocabularyText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function normalizeVocabularyLabel(value: string): string {
  return value.trim().toLocaleLowerCase();
}
