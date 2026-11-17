import type { VocabularyWord } from "@/data/vocabulary";
import { getCommunityContentStatus, type CategoryTab, type CommunityCategory, type CommunityWord } from "@/lib/admin-category-data";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";
import { isDefaultVocabularyCategory } from "@/lib/vocabulary/default-categories";
import { getFirstImageByKey } from "@/lib/vocabulary/first-image-by-key";

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

export function getSharedAdminCategory(
  activeTab: CategoryTab,
  category: AdminCategory | null,
  publishedCategoriesByName: Map<string, CommunityCategory>,
): CommunityCategory | undefined | null {
  if (!category) return null;
  if (activeTab === "default") {
    return publishedCategoriesByName.get(normalizeVocabularyLabel(category.name));
  }
  return "owner_id" in category ? category : null;
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
  const customCategories: CommunityCategory[] = [];
  const status = getCommunityContentStatus(activeTab);
  for (const category of communityCategories) {
    if (category.status === status && !isDefaultVocabularyCategory(category.name)) {
      customCategories.push(category);
    }
  }
  const currentCategories = activeTab === "default" ? defaultCategories : customCategories;
  const normalizedSearch = normalizeVocabularyLabel(categorySearch);
  const visibleCategories: AdminCategory[] = [];
  let firstCategory: AdminCategory | null = null;
  let selectedCategory: AdminCategory | null = null;
  for (const category of currentCategories) {
    firstCategory ??= category;
    if (category.id === selectedId) selectedCategory = category;
    if (category.name.toLocaleLowerCase().includes(normalizedSearch)) visibleCategories.push(category);
  }
  selectedCategory ??= firstCategory;

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
  const defaultFallbackImagesByCategory = getFirstImageByKey(
    defaultWordsByCategory.entries(),
    ([categoryName]) => categoryName,
    ([, categoryWords]) => categoryWords.find((word) => word.imagePath)?.imagePath,
  );
  const firstCommunityImage = words.find((word) => word.image_path)?.image_path;

  const visibleCategoryRows: AdminCategoryListRow[] = visibleCategories.map((category) => {
    const shared = getSharedAdminCategory(activeTab, category, publishedCategoriesByName);
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
  const selectedSharedCategory = getSharedAdminCategory(activeTab, selectedCategory, publishedCategoriesByName) ?? null;
  const selectedFallbackImage = (activeTab === "default" && selectedCategory ? defaultFallbackImagesByCategory.get(selectedCategory.name) : undefined)
    ?? firstCommunityImage
    ?? null;

  return { visibleCategoryRows, defaultWords, selectedSharedCategory, selectedFallbackImage };
}
