import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import {
  deleteVocabularyWord,
  deleteVocabularyWords,
  getVocabularyWordById,
  getVocabularyWordImagePaths,
} from "@/lib/supabase/vocabulary";
import { deleteVocabularyImages } from "@/lib/supabase/vocabulary-images";
import { invalidateVocabularyMutationCaches } from "@/lib/vocabulary/invalidate-mutation-caches";
import { toast } from "sonner";

interface VocabularyDeletionMutationOptions {
  words: VocabularyWord[];
  setWords: Dispatch<SetStateAction<VocabularyWord[]>>;
  ownerIdRef: MutableRefObject<string | null>;
}

export function useVocabularyDeletionMutations({
  words,
  setWords,
  ownerIdRef,
}: VocabularyDeletionMutationOptions) {
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

      setWords((current) => current.filter((item) => item.id !== id));
      invalidateVocabularyMutationCaches(ownerIdRef.current ?? undefined, {
        reviewHistory: true,
        learningAnalytics: true,
        reviewSchedule: true,
      });

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

      setWords((current) => current.filter((word) => !deletedSet.has(word.id)));
      invalidateVocabularyMutationCaches(ownerIdRef.current ?? undefined, {
        reviewHistory: true,
        learningAnalytics: true,
        reviewSchedule: true,
      });

      return deletedIds.length;
    } catch (error) {
      console.error("Supabase deleteWords error:", error);
      toast.error("Failed to delete selected words.");
      return 0;
    }
  }

  return { deleteWord, deleteWords };
}
