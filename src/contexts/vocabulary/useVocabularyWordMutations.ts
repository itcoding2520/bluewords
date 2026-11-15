import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import { getErrorMessage } from "@/lib/errors";
import {
  updateVocabularyWord,
} from "@/lib/supabase/vocabulary";
import { deleteVocabularyImages } from "@/lib/supabase/vocabulary-images";
import { invalidateVocabularyMutationCaches } from "@/lib/vocabulary/invalidate-mutation-caches";
import { hasDuplicateVocabularyWord } from "@/lib/vocabulary/word-mutations";
import {
  createVocabularyWordRecord,
  updateVocabularyWordRecord,
} from "@/lib/vocabulary/word-mutation-workflows";
import { toast } from "sonner";

interface VocabularyWordMutationOptions {
  words: VocabularyWord[];
  setWords: Dispatch<SetStateAction<VocabularyWord[]>>;
  ownerIdRef: MutableRefObject<string | null>;
  refreshWords: () => Promise<void>;
}

export function useVocabularyWordMutations({
  words,
  setWords,
  ownerIdRef,
  refreshWords,
}: VocabularyWordMutationOptions) {
  async function addWord(word: VocabularyWord): Promise<boolean> {
    if (hasDuplicateVocabularyWord(words, word)) {
      toast.error(`"${word.word.trim()}" already exists in ${word.category}.`);
      return false;
    }

    try {
      const savedWord = await createVocabularyWordRecord(word);
      setWords((current) => [savedWord, ...current]);
      invalidateVocabularyMutationCaches(ownerIdRef.current ?? undefined);
      toast.success(`"${savedWord.word}" added successfully!`);
      return true;
    } catch (error) {
      console.error("Supabase addWord error:", error);
      toast.error(getErrorMessage(error, "Failed to add word."));
      return false;
    }
  }

  async function updateWord(updatedWord: VocabularyWord): Promise<boolean> {
    if (hasDuplicateVocabularyWord(words, updatedWord, updatedWord.id)) {
      toast.error(`"${updatedWord.word.trim()}" already exists in ${updatedWord.category}.`);
      return false;
    }

    try {
      const currentWord = words.find((word) => word.id === updatedWord.id);
      const { word: savedWord, previousImagePath } = await updateVocabularyWordRecord(updatedWord, currentWord);

      setWords((current) => current.map((word) =>
        word.id === savedWord.id
          ? savedWord
          : word
      ));
      invalidateVocabularyMutationCaches(ownerIdRef.current ?? undefined, { reviewHistory: true });

      if (previousImagePath && previousImagePath !== savedWord.imagePath) {
        void deleteVocabularyImages([previousImagePath]).catch((error) =>
          console.error("Could not remove replaced vocabulary image:", error)
        );
      }

      toast.success(`"${savedWord.word}" updated successfully!`);
      return true;
    } catch (error) {
      console.error("Supabase updateWord error:", error);
      await refreshWords();
      toast.error("Failed to update word.");
      return false;
    }
  }

  async function toggleMastered(id: string, currentStatus?: VocabularyWord["status"]): Promise<boolean> {
    const word = words.find((item) => item.id === id);
    if (word?.isCustom) return false;

    const nextStatus = (word?.status ?? currentStatus) === "mastered" ? "learning" : "mastered";
    try {
      const row = await updateVocabularyWord(id, { status: nextStatus });
      setWords((current) => current.map((item) =>
        item.id === row.id ? { ...item, status: row.status } : item
      ));
      invalidateVocabularyMutationCaches(ownerIdRef.current ?? undefined, { reviewHistory: true });
      return true;
    } catch {
      toast.error("Failed to update word status.");
      return false;
    }
  }

  return { addWord, updateWord, toggleMastered };
}
