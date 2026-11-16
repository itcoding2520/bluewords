import type {
  AdminReviewSubmission,
  PublishedCategory,
  PublishedWord,
} from "@/lib/admin-review-types";

export function mapPublishedCategorySubmission(
  category: AdminReviewSubmission,
): PublishedCategory {
  return {
    id: category.id,
    owner_id: category.owner_id,
    name: category.name ?? "",
    color: category.color ?? "blue",
    status: "published",
    image_path: category.image_path ?? null,
  };
}

export function mapPublishedWordSubmission(
  word: AdminReviewSubmission,
): PublishedWord | null {
  if (!word.category_id || !word.word) return null;
  return {
    id: word.id,
    owner_id: word.owner_id,
    category_id: word.category_id,
    word: word.word,
    meaning: word.meaning ?? "",
    status: "published",
    image_path: word.image_path ?? null,
  };
}

export function getPublishedCategoryFallbackImages(
  words: PublishedWord[],
): Map<string, string> {
  const imagesByCategory = new Map<string, string>();
  for (const word of words) {
    if (word.image_path && !imagesByCategory.has(word.category_id)) {
      imagesByCategory.set(word.category_id, word.image_path);
    }
  }
  return imagesByCategory;
}
