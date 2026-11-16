export function normalizeVocabularyKey(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeVocabularyText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function getVocabularyTextPairKey(first: string, second: string): string {
  return `${normalizeVocabularyText(first)}\u0000${normalizeVocabularyText(second)}`;
}

export function normalizeVocabularyLabel(value: string): string {
  return value.trim().toLocaleLowerCase();
}
