import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import { invalidateVocabularyMutationCaches } from "@/lib/vocabulary/invalidate-mutation-caches";
import {
  deleteVocabularyWordRecord,
  deleteVocabularyWordRecords,
} from "@/lib/vocabulary/word-mutation-workflows";
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
      const deletedWordName = await deleteVocabularyWordRecord(id, word);

      setWords((current) => current.filter((item) => item.id !== id));
      invalidateVocabularyMutationCaches(ownerIdRef.current ?? undefined, {
        reviewHistory: true,
        learningAnalytics: true,
        reviewSchedule: true,
      });

      toast.success(`"${deletedWordName}" deleted successfully!`);
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
      const deletedIds = await deleteVocabularyWordRecords(uniqueIds);
      const deletedSet = new Set(deletedIds);

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
