import type { VocabularyWord } from "@/data/vocabulary";
import { getCommunityContentStatus, type CategoryTab, type CommunityCategory, type CommunityWord } from "@/lib/admin-category-data";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";
import { isDefaultVocabularyCategory } from "@/lib/vocabulary/default-categories";

export type AdminCategory = VocabularyCategoryRow | CommunityCategory;

export interface AdminCategoryListRow {
  category: AdminCategory;
  shared: CommunityCategory | null | undefined;
  owner: string | null;
  fallbackImage: string | null | undefined;
  defaultWordCount: number | null;
  createdAt: string | null;
}

export function indexPublishedCategories(categories: CommunityCategory[]) {
  const categoriesByName = new Map<string, CommunityCategory>();
  for (const category of categories) {
    if (category.status !== "published") continue;
    const key = normalizeVocabularyLabel(category.name);
    if (!categoriesByName.has(key)) categoriesByName.set(key, category);
  }
  return categoriesByName;
}

export function deriveAdminCategorySelection({
  activeTab,
  selectedId,
  categorySearch,
  communityCategories,
  defaultCategories,
}: {
  activeTab: CategoryTab;
  selectedId: string;
  categorySearch: string;
  communityCategories: CommunityCategory[];
  defaultCategories: VocabularyCategoryRow[];
}) {
  const customCategories = communityCategories.filter((category) =>
    category.status === getCommunityContentStatus(activeTab)
    && !isDefaultVocabularyCategory(category.name)
  );
  const currentCategories = activeTab === "default" ? defaultCategories : customCategories;
  const normalizedSearch = normalizeVocabularyLabel(categorySearch);
  const visibleCategories = currentCategories.filter((category) =>
    category.name.toLocaleLowerCase().includes(normalizedSearch)
  );
  const selectedCategory = currentCategories.find((category) => category.id === selectedId)
    ?? currentCategories[0]
    ?? null;

  return { customCategories, currentCategories, visibleCategories, selectedCategory };
}

export function deriveAdminCategoryDetails({
  activeTab,
  visibleCategories,
  selectedCategory,
  publishedCategoriesByName,
  defaultWordsByCategory,
  emails,
  words,
}: {
  activeTab: CategoryTab;
  visibleCategories: AdminCategory[];
  selectedCategory: AdminCategory | null;
  publishedCategoriesByName: Map<string, CommunityCategory>;
  defaultWordsByCategory: Map<string, VocabularyWord[]>;
  emails: Record<string, string>;
  words: CommunityWord[];
}) {
  const defaultFallbackImagesByCategory = new Map<string, string>();
  for (const [categoryName, categoryWords] of defaultWordsByCategory) {
    const firstImage = categoryWords.find((word) => word.imagePath)?.imagePath;
    if (firstImage) defaultFallbackImagesByCategory.set(categoryName, firstImage);
  }
  const firstCommunityImage = words.find((word) => word.image_path)?.image_path;

  const visibleCategoryRows: AdminCategoryListRow[] = visibleCategories.map((category) => {
    const shared = activeTab === "default"
      ? publishedCategoriesByName.get(normalizeVocabularyLabel(category.name))
      : "owner_id" in category ? category : null;
    const fallbackImage = activeTab === "default"
      ? defaultFallbackImagesByCategory.get(category.name)
      : category.id === selectedCategory?.id
        ? firstCommunityImage
        : undefined;

    return {
      category,
      shared,
      owner: shared ? emails[shared.owner_id] ?? "Loading owner…" : null,
      fallbackImage,
      defaultWordCount: activeTab === "default"
        ? defaultWordsByCategory.get(category.name)?.length ?? 0
        : null,
      createdAt: "owner_id" in category ? category.created_at : null,
    };
  });

  const defaultWords = activeTab === "default" && selectedCategory
    ? defaultWordsByCategory.get(selectedCategory.name) ?? []
    : [];
  const selectedSharedCategory = selectedCategory
    ? activeTab === "default"
      ? publishedCategoriesByName.get(normalizeVocabularyLabel(selectedCategory.name)) ?? null
      : "owner_id" in selectedCategory ? selectedCategory : null
    : null;
  const selectedFallbackImage = (activeTab === "default" && selectedCategory ? defaultFallbackImagesByCategory.get(selectedCategory.name) : undefined)
    ?? firstCommunityImage
    ?? null;

  return { visibleCategoryRows, defaultWords, selectedSharedCategory, selectedFallbackImage };
}
