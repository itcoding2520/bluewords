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
  const communityCategoryEntries = communityCategories.map((category) => ({
    category,
    normalizedName: normalizeVocabularyLabel(category.name),
  }));
  const sharedByName = new Map(communityCategoryEntries.map(({ category, normalizedName }) => [
    normalizedName,
    category,
  ]));
  const baseCategoryEntries = baseCategories.map((category) => ({
    category,
    normalizedName: normalizeVocabularyLabel(category.name),
  }));
  const baseNames = new Set(baseCategoryEntries.map(({ normalizedName }) => normalizedName));
  const baseWithSharedImages = baseCategoryEntries.map(({ category, normalizedName }) => ({
    ...category,
    image_path: sharedByName.get(normalizedName)?.image_path
      ?? category.image_path
      ?? null,
  }));
  const sharedOnlyCategories = communityCategoryEntries
    .filter(({ normalizedName }) => !baseNames.has(normalizedName))
    .map(({ category }) => {
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
