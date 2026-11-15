import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import {
  addVocabularyCategory,
  deleteVocabularyCategory,
  updateVocabularyCategory,
  type VocabularyCategoryColor,
  type VocabularyCategoryRow,
  type VocabularyCategoryUpdate,
} from "@/lib/supabase/categories";
import { invalidateVocabularyPageCache } from "@/lib/supabase/vocabulary-page-cache.mjs";
import { invalidateDashboardVocabularyOverviewCache } from "@/lib/supabase/dashboard-vocabulary";
import { invalidateLatestVocabularyReviewsCache } from "@/lib/supabase/reviews";
import { sortCategories } from "@/lib/vocabulary/shared-vocabulary";
import { toast } from "sonner";

interface VocabularyCategoryMutationOptions {
  categories: VocabularyCategoryRow[];
  setWords: Dispatch<SetStateAction<VocabularyWord[]>>;
  setCategories: Dispatch<SetStateAction<VocabularyCategoryRow[]>>;
  ownerIdRef: MutableRefObject<string | null>;
}

export function useVocabularyCategoryMutations({
  categories,
  setWords,
  setCategories,
  ownerIdRef,
}: VocabularyCategoryMutationOptions) {
  async function addCategory(input: {
    id?: string;
    name: string;
    color: VocabularyCategoryColor;
    image_path?: string | null;
  }): Promise<VocabularyCategoryRow | null> {
    try {
      const row = await addVocabularyCategory(input);
      setCategories((current) => sortCategories([...current, row]));
      invalidateVocabularyPageCache();
      toast.success(`Category "${row.name}" added.`);
      return row;
    } catch (error) {
      console.error("Supabase addCategory error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add category.");
      return null;
    }
  }

  async function updateCategory(
    id: string,
    updates: VocabularyCategoryUpdate,
    options?: { silent?: boolean }
  ): Promise<VocabularyCategoryRow | null> {
    const previous = categories.find((category) => category.id === id);
    if (!previous) return null;

    try {
      const row = await updateVocabularyCategory(id, updates);
      setCategories((current) => sortCategories(
        current.map((category) => category.id === row.id ? row : category)
      ));
      invalidateVocabularyPageCache();

      if (previous.name !== row.name) {
        setWords((current) => current.map((word) =>
          word.category === previous.name ? { ...word, category: row.name } : word
        ));
      }
      invalidateDashboardVocabularyOverviewCache(ownerIdRef.current ?? undefined);
      invalidateLatestVocabularyReviewsCache();

      if (!options?.silent) toast.success(`Category "${row.name}" updated.`);
      return row;
    } catch (error) {
      console.error("Supabase updateCategory error:", error);
      if (!options?.silent) {
        toast.error(error instanceof Error ? error.message : "Failed to update category.");
      }
      return null;
    }
  }

  async function deleteCategory(id: string): Promise<boolean> {
    const category = categories.find((item) => item.id === id);
    if (!category || category.is_default) return false;

    try {
      await deleteVocabularyCategory(id);
      setCategories((current) => current.filter((item) => item.id !== id));
      setWords((current) => current.map((word) =>
        word.category === category.name ? { ...word, category: "Uncategorized" } : word
      ));
      invalidateVocabularyPageCache();
      invalidateDashboardVocabularyOverviewCache(ownerIdRef.current ?? undefined);
      invalidateLatestVocabularyReviewsCache();
      toast.success(`Category "${category.name}" deleted.`);
      return true;
    } catch (error) {
      console.error("Supabase deleteCategory error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete category.");
      return false;
    }
  }

  return { addCategory, updateCategory, deleteCategory };
}
