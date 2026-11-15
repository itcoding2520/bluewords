import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { VocabularyWord } from "@/data/vocabulary";

export function getVocabularyDropdownCategories(
  categories: VocabularyCategoryRow[],
  words: VocabularyWord[],
  includeUncategorized = false,
): VocabularyCategoryRow[] {
  const byName = new Map(categories.map((category) => [category.name.trim().toLocaleLowerCase(), category]));
  const namesByKey = new Map<string, string>();
  for (const rawName of [...categories.map((item) => item.name), ...words.map((word) => word.category)]) {
    const name = rawName.trim();
    const key = name.toLocaleLowerCase();
    if (name && (includeUncategorized || key !== "uncategorized") && !namesByKey.has(key)) namesByKey.set(key, name);
  }
  const names = [...namesByKey.values()].sort((left, right) => left.localeCompare(right));

  return names.map((name) => byName.get(name.toLocaleLowerCase()) ?? {
    id: `category-${name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    user_id: "",
    name,
    color: "slate",
    image_path: null,
    is_default: false,
    created_at: "",
    updated_at: "",
  });
}
