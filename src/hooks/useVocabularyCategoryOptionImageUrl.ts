import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { getCategoryImageUrl } from "@/lib/supabase/category-images";

const CATEGORY_IMAGE_PREFIX = "category:";

export function useVocabularyCategoryOptionImageUrl(imagePath?: string | null) {
  const isCategoryImage = imagePath?.startsWith(CATEGORY_IMAGE_PREFIX) ?? false;
  const wordImageUrl = useVocabularyImageUrl(isCategoryImage ? null : imagePath);

  return isCategoryImage
    ? getCategoryImageUrl(imagePath?.slice(CATEGORY_IMAGE_PREFIX.length))
    : wordImageUrl;
}
