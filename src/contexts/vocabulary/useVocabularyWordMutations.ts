import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { VocabularyMeaning, VocabularyWord } from "@/data/vocabulary";
import {
  addVocabularyWord,
  deleteVocabularyWord,
  getVocabularyWordById,
  updateVocabularyWord,
  updateVocabularyWordWithMeanings,
} from "@/lib/supabase/vocabulary";
import { deleteVocabularyImages } from "@/lib/supabase/vocabulary-images";
import { invalidateVocabularyMutationCaches } from "@/lib/vocabulary/invalidate-mutation-caches";
import { saveVocabularyMeanings } from "@/lib/supabase/vocabulary-meanings";
import { hasDuplicateVocabularyWord, mapVocabularyMutationWord } from "@/lib/vocabulary/word-mutations";
import { normalizeVocabularyKey } from "@/lib/vocabulary/normalize-text";
import { resolveVocabularyIpa } from "@/lib/vocabulary/resolve-ipa";
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
      const type = word.type ?? "word";
      const ipa = await resolveVocabularyIpa({ word: word.word, type, providedIpa: word.ipa });
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
        savedMeanings = await saveVocabularyMeanings(row.id, word.detailedMeanings ?? []);
      } catch (error) {
        try {
          await deleteVocabularyWord(row.id);
        } catch (rollbackError) {
          console.error("Failed to roll back vocabulary after meaning save error:", rollbackError);
        }
        throw error;
      }

      const savedWord = mapVocabularyMutationWord(row, savedMeanings);
      setWords((current) => [savedWord, ...current]);
      invalidateVocabularyMutationCaches(ownerIdRef.current ?? undefined);
      toast.success(`"${row.word}" added successfully!`);
      return true;
    } catch (error) {
      console.error("Supabase addWord error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add word.");
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
      const storedWord = currentWord ? null : await getVocabularyWordById(updatedWord.id);
      const previousImagePath = currentWord?.imagePath ?? storedWord?.image_path ?? null;
      const previousIpa = currentWord?.ipa ?? storedWord?.ipa ?? updatedWord.ipa;
      const type = updatedWord.type ?? "word";
      const wordChanged = normalizeVocabularyKey(currentWord?.word ?? storedWord?.word ?? updatedWord.word) !== normalizeVocabularyKey(updatedWord.word);
      const ipa = await resolveVocabularyIpa({
        word: updatedWord.word,
        type,
        providedIpa: updatedWord.ipa,
        existingIpa: wordChanged ? null : previousIpa,
      });
      const { word: row, meanings: meaningRows } = await updateVocabularyWordWithMeanings({
        id: updatedWord.id,
        word: updatedWord.word,
        meaning: updatedWord.meaning,
        category: updatedWord.category,
        status: updatedWord.status,
        type,
        ipa,
        image_path: updatedWord.imagePath ?? null,
        meanings: (updatedWord.detailedMeanings ?? currentWord?.detailedMeanings ?? [])
          .filter((item) => item.meaning.trim())
          .map((item) => ({ part_of_speech: item.partOfSpeech, meaning: item.meaning.trim() })),
      });
      const savedWord = mapVocabularyMutationWord(row, meaningRows);

      setWords((current) => current.map((word) =>
        word.id === row.id
          ? savedWord
          : word
      ));
      invalidateVocabularyMutationCaches(ownerIdRef.current ?? undefined, { reviewHistory: true });

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
