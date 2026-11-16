import type { VocabularyCategoryColor } from "@/config/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { createCommunityCategoryId } from "@/lib/vocabulary/community-category-id";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";

export type CommunityVocabularyCategorySource = {
  id: string;
  name: string;
  color: VocabularyCategoryColor;
  image_path?: string | null;
};

export function mapCommunityVocabularyCategories<TCategory extends CommunityVocabularyCategorySource>(
  baseCategories: VocabularyCategoryRow[],
  communityCategories: TCategory[],
  getCommunityMetadata: (category: TCategory) => {
    userId: string;
    createdAt: string;
    updatedAt: string;
  },
): VocabularyCategoryRow[] {
  const sharedByName = new Map(communityCategories.map((category) => [
    normalizeVocabularyLabel(category.name),
    category,
  ]));
  const baseNames = new Set(baseCategories.map((category) => normalizeVocabularyLabel(category.name)));
  const baseWithSharedImages = baseCategories.map((category) => ({
    ...category,
    image_path: sharedByName.get(normalizeVocabularyLabel(category.name))?.image_path
      ?? category.image_path
      ?? null,
  }));
  const sharedOnlyCategories = communityCategories
    .filter((category) => !baseNames.has(normalizeVocabularyLabel(category.name)))
    .map((category) => {
      const metadata = getCommunityMetadata(category);
      return {
        id: createCommunityCategoryId(category.id),
        user_id: metadata.userId,
        name: category.name,
        color: category.color,
        is_default: false,
        created_at: metadata.createdAt,
        updated_at: metadata.updatedAt,
        image_path: category.image_path ?? null,
      };
    });

  return [...baseWithSharedImages, ...sharedOnlyCategories];
}
