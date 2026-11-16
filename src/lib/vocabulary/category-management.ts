import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { isCommunityCategoryId } from "@/lib/vocabulary/community-category-id";
import { isDefaultVocabularyCategory } from "@/lib/vocabulary/default-categories";

export function isDefaultCategory(category: Pick<VocabularyCategoryRow, "is_default" | "name">) {
  return category.is_default || isDefaultVocabularyCategory(category.name);
}

export function isPublishedSharedCategory(category: Pick<VocabularyCategoryRow, "id" | "user_id">) {
  return isCommunityCategoryId(category.id) || category.user_id === "community";
}
