import type { VocabularyCategoryRow } from "@/lib/supabase/categories";

export function getFirstVocabularyCategoriesByName(categories: VocabularyCategoryRow[]) {
  const categoriesByName = new Map<string, VocabularyCategoryRow>();
  for (const category of categories) {
    if (!categoriesByName.has(category.name)) categoriesByName.set(category.name, category);
  }
  return categoriesByName;
}
