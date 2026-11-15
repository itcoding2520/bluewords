import type { VocabularyType } from "@/config/vocabulary";
import { fetchEnglishIpa } from "@/lib/dictionary";

export async function resolveVocabularyIpa(input: {
  word: string;
  type: VocabularyType;
  providedIpa?: string | null;
  existingIpa?: string | null;
}): Promise<string | null> {
  if (input.type !== "word") return null;

  const providedIpa = input.providedIpa?.trim();
  if (providedIpa) return providedIpa;
  if (input.existingIpa) return input.existingIpa;
  return fetchEnglishIpa(input.word);
}
