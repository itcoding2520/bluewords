import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { VocabularyMeaning, VocabularyWord } from "@/data/vocabulary";
import {
  addVocabularyWord,
  deleteVocabularyWord,
  deleteVocabularyWords,
  getVocabularyWordById,
  getVocabularyWordImagePaths,
  updateVocabularyWord,
  updateVocabularyWordWithMeanings,
} from "@/lib/supabase/vocabulary";
import {
  addVocabularyCategory,
  deleteVocabularyCategory,
  updateVocabularyCategory,
  type VocabularyCategoryColor,
  type VocabularyCategoryRow,
  type VocabularyCategoryUpdate,
} from "@/lib/supabase/categories";
import { deleteVocabularyImages } from "@/lib/supabase/vocabulary-images";
import { fetchEnglishIpa } from "@/lib/dictionary";
import {
  invalidateLatestVocabularyReviewsCache,
  invalidateVocabularyReviewScheduleCache,
} from "@/lib/supabase/reviews";
import { invalidateLearningAnalyticsCache } from "@/lib/supabase/learning-analytics";
import { invalidateDashboardVocabularyOverviewCache } from "@/lib/supabase/dashboard-vocabulary";
import { invalidateVocabularyPageCache } from "@/lib/supabase/vocabulary-page-cache.mjs";
import { mapVocabularyMeaning, sortCategories } from "@/lib/vocabulary/shared-vocabulary";
import { saveVocabularyMeanings } from "@/lib/supabase/vocabulary-meanings";
import { toast } from "sonner";

type MutationOptions = {
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  setWords: Dispatch<SetStateAction<VocabularyWord[]>>;
  setCategories: Dispatch<SetStateAction<VocabularyCategoryRow[]>>;
  ownerIdRef: MutableRefObject<string | null>;
  refreshWords: () => Promise<void>;
};

export function useVocabularyMutations({ words, categories, setWords, setCategories, ownerIdRef, refreshWords }: MutationOptions) {
  async function addWord(word: VocabularyWord): Promise<boolean> {
    const duplicate = words.some((current) =>
      current.category.trim().replace(/\s+/g, " ").toLowerCase() === word.category.trim().replace(/\s+/g, " ").toLowerCase()
      && current.word.trim().replace(/\s+/g, " ").toLowerCase() === word.word.trim().replace(/\s+/g, " ").toLowerCase()
    );
    if (duplicate) {
      toast.error(`"${word.word.trim()}" already exists in ${word.category}.`);
      return false;
    }

    try {
      const type = word.type ?? "word";
      const ipa = type === "word"
        ? word.ipa?.trim() || await fetchEnglishIpa(word.word)
        : null;
      const row = await addVocabularyWord({
        word: word.word,
        meaning: word.meaning,
        category: word.category,
        status: word.status,
        type,
        ipa,
        image_path: word.imagePath ?? null,
      });

      let savedMeanings: VocabularyMeaning[];

      try {
        savedMeanings = await saveVocabularyMeanings(
          row.id,
          word.detailedMeanings ?? []
        );
      } catch (error) {
        try {
          await deleteVocabularyWord(row.id);
        } catch (rollbackError) {
          console.error(
            "Failed to roll back vocabulary after meaning save error:",
            rollbackError
          );
        }

        throw error;
      }

      setWords((current) => [
        {
          id: row.id,
          word: row.word,
          meaning: row.meaning,
          category: row.category,
          status: row.status,
          type: row.type ?? "word",
          ipa: row.ipa ?? null,
          imagePath: row.image_path ?? null,
          detailedMeanings: savedMeanings,
        },
        ...current,
      ]);
      invalidateVocabularyPageCache();
      invalidateDashboardVocabularyOverviewCache(ownerIdRef.current ?? undefined);

      toast.success(`"${row.word}" added successfully!`);
      return true;
    } catch (error) {
      console.error("Supabase addWord error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add word."
      );

      return false;
    }
  }

  async function updateWord(
    updatedWord: VocabularyWord
  ): Promise<boolean> {
    const duplicate = words.some((current) =>
      current.id !== updatedWord.id
      && current.category.trim().replace(/\s+/g, " ").toLowerCase() === updatedWord.category.trim().replace(/\s+/g, " ").toLowerCase()
      && current.word.trim().replace(/\s+/g, " ").toLowerCase() === updatedWord.word.trim().replace(/\s+/g, " ").toLowerCase()
    );
    if (duplicate) {
      toast.error(`"${updatedWord.word.trim()}" already exists in ${updatedWord.category}.`);
      return false;
    }

    try {
      const currentWord = words.find(
        (word) => word.id === updatedWord.id
      );
      const storedWord = currentWord ? null : await getVocabularyWordById(updatedWord.id);
      const previousImagePath = currentWord?.imagePath ?? storedWord?.image_path ?? null;
      const previousIpa = currentWord?.ipa ?? storedWord?.ipa ?? updatedWord.ipa;
      const type = updatedWord.type ?? "word";
      const wordChanged = (currentWord?.word ?? storedWord?.word ?? updatedWord.word).trim().toLowerCase() !== updatedWord.word.trim().toLowerCase();
      const ipa = type !== "word"
        ? null
        : updatedWord.ipa?.trim() || (wordChanged || !previousIpa
          ? await fetchEnglishIpa(updatedWord.word)
          : previousIpa);
      const { word: row, meanings: meaningRows } =
        await updateVocabularyWordWithMeanings({
          id: updatedWord.id,
          word: updatedWord.word,
          meaning: updatedWord.meaning,
          category: updatedWord.category,
          status: updatedWord.status,
          type,
          ipa,
          image_path: updatedWord.imagePath ?? null,
          meanings: (updatedWord.detailedMeanings ??
            currentWord?.detailedMeanings ?? [])
            .filter((item) => item.meaning.trim())
            .map((item) => ({
              part_of_speech: item.partOfSpeech,
              meaning: item.meaning.trim(),
            })),
        });
      const savedMeanings = meaningRows.map(mapVocabularyMeaning);

      setWords((current) =>
        current.map((word) =>
          word.id === row.id
            ? {
                id: row.id,
                word: row.word,
                meaning: row.meaning,
                category: row.category,
                status: row.status,
                type: row.type ?? "word",
                ipa: row.ipa ?? null,
                imagePath: row.image_path ?? null,
                detailedMeanings: savedMeanings,
              }
            : word
        )
      );
      invalidateVocabularyPageCache();
      invalidateDashboardVocabularyOverviewCache(ownerIdRef.current ?? undefined);
      invalidateLatestVocabularyReviewsCache();

      if (previousImagePath && previousImagePath !== row.image_path) {
        void deleteVocabularyImages([previousImagePath]).catch((error) =>
          console.error("Could not remove replaced vocabulary image:", error)
        );
      }

      toast.success(`"${row.word}" updated successfully!`);
      return true;
    } catch (error) {
      console.error("Supabase updateWord error:", error);
      await refreshWords();
      toast.error("Failed to update word.");
      return false;
    }
  }

  async function deleteWord(id: string): Promise<boolean> {
    if (id.startsWith("community-")) {
      toast.error("Published community words are read-only.");
      return false;
    }
    const word = words.find((item) => item.id === id);

    try {
      const storedWord = word ? null : await getVocabularyWordById(id);
      await deleteVocabularyWord(id);

      const imagePath = word?.imagePath ?? storedWord?.image_path;
      if (imagePath) {
        void deleteVocabularyImages([imagePath]).catch((error) =>
          console.error("Could not remove vocabulary image:", error)
        );
      }

      setWords((current) =>
        current.filter((item) => item.id !== id)
      );
      invalidateVocabularyPageCache();
      invalidateDashboardVocabularyOverviewCache(ownerIdRef.current ?? undefined);
      invalidateLatestVocabularyReviewsCache();
      invalidateLearningAnalyticsCache();
      invalidateVocabularyReviewScheduleCache();

      toast.success(`"${word?.word ?? storedWord?.word ?? "Word"}" deleted successfully!`);
      return true;
    } catch {
      toast.error("Failed to delete word.");
      return false;
    }
  }

  async function deleteWords(ids: string[]): Promise<number> {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return 0;

    try {
      const imageRows = await getVocabularyWordImagePaths(uniqueIds);
      const deletedIds = await deleteVocabularyWords(uniqueIds);
      const deletedSet = new Set(deletedIds);
      const deletedImagePaths = imageRows
        .filter((word) => deletedSet.has(word.id))
        .map((word) => word.image_path);

      if (deletedImagePaths.some(Boolean)) {
        void deleteVocabularyImages(deletedImagePaths).catch((error) =>
          console.error("Could not remove deleted vocabulary images:", error)
        );
      }

      setWords((current) =>
        current.filter((word) => !deletedSet.has(word.id))
      );
      invalidateVocabularyPageCache();
      invalidateDashboardVocabularyOverviewCache(ownerIdRef.current ?? undefined);
      invalidateLatestVocabularyReviewsCache();
      invalidateLearningAnalyticsCache();
      invalidateVocabularyReviewScheduleCache();

      return deletedIds.length;
    } catch (error) {
      console.error("Supabase deleteWords error:", error);
      toast.error("Failed to delete selected words.");
      return 0;
    }
  }

  async function toggleMastered(id: string, currentStatus?: VocabularyWord["status"]): Promise<boolean> {
    const word = words.find((item) => item.id === id);
    if (word?.isCustom) return false;

    const nextStatus =
      (word?.status ?? currentStatus) === "mastered" ? "learning" : "mastered";

    try {
      const row = await updateVocabularyWord(id, {
        status: nextStatus,
      });

      setWords((current) =>
        current.map((item) =>
          item.id === row.id
            ? { ...item, status: row.status }
            : item
        )
      );
      invalidateVocabularyPageCache();
      invalidateDashboardVocabularyOverviewCache(ownerIdRef.current ?? undefined);
      invalidateLatestVocabularyReviewsCache();

      return true;
    } catch {
      toast.error("Failed to update word status.");
      return false;
    }
  }

  async function addCategory(input: {
    id?: string;
    name: string;
    color: VocabularyCategoryColor;
    image_path?: string | null;
  }): Promise<VocabularyCategoryRow | null> {
    try {
      const row = await addVocabularyCategory(input);

      setCategories((current) =>
        sortCategories([...current, row])
      );
      invalidateVocabularyPageCache();
      toast.success(`Category "${row.name}" added.`);
      return row;
    } catch (error) {
      console.error("Supabase addCategory error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add category."
      );
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

      setCategories((current) =>
        sortCategories(
          current.map((category) =>
            category.id === row.id ? row : category
          )
        )
      );
      invalidateVocabularyPageCache();

      if (previous.name !== row.name) {
        setWords((current) =>
          current.map((word) =>
            word.category === previous.name
              ? { ...word, category: row.name }
              : word
          )
        );
      }
      invalidateDashboardVocabularyOverviewCache(ownerIdRef.current ?? undefined);
      invalidateLatestVocabularyReviewsCache();

      if (!options?.silent) toast.success(`Category "${row.name}" updated.`);
      return row;
    } catch (error) {
      console.error("Supabase updateCategory error:", error);
      if (!options?.silent) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to update category."
        );
      }
      return null;
    }
  }

  async function deleteCategory(id: string): Promise<boolean> {
    const category = categories.find((item) => item.id === id);

    if (!category || category.is_default) return false;

    try {
      await deleteVocabularyCategory(id);

      setCategories((current) =>
        current.filter((item) => item.id !== id)
      );
      setWords((current) =>
        current.map((word) =>
          word.category === category.name
            ? { ...word, category: "Uncategorized" }
            : word
        )
      );
      invalidateVocabularyPageCache();
      invalidateDashboardVocabularyOverviewCache(ownerIdRef.current ?? undefined);
      invalidateLatestVocabularyReviewsCache();

      toast.success(`Category "${category.name}" deleted.`);
      return true;
    } catch (error) {
      console.error("Supabase deleteCategory error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete category."
      );
      return false;
    }
  }


  return { addWord, updateWord, deleteWord, deleteWords, toggleMastered, addCategory, updateCategory, deleteCategory };
}
