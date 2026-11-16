import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { VocabularyWord } from "@/data/vocabulary";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";

export function getVocabularyDropdownCategories(
  categories: VocabularyCategoryRow[],
  words: VocabularyWord[],
  includeUncategorized = false,
): VocabularyCategoryRow[] {
  const byName = new Map(categories.map((category) => [normalizeVocabularyLabel(category.name), category]));
  const namesByKey = new Map<string, string>();
  for (const rawName of [...categories.map((item) => item.name), ...words.map((word) => word.category)]) {
    const name = rawName.trim();
    const key = normalizeVocabularyLabel(name);
    if (name && (includeUncategorized || key !== "uncategorized") && !namesByKey.has(key)) namesByKey.set(key, name);
  }
  const names = [...namesByKey.entries()].sort(([, left], [, right]) => left.localeCompare(right));

  return names.map(([key, name]) => byName.get(key) ?? {
    id: `category-${key.replace(/[^a-z0-9]+/g, "-")}`,
    user_id: "",
    name,
    color: "slate",
    image_path: null,
    is_default: false,
    created_at: "",
    updated_at: "",
  });
}
