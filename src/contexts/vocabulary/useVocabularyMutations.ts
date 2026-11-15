import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { useVocabularyCategoryMutations } from "@/contexts/vocabulary/useVocabularyCategoryMutations";
import { useVocabularyDeletionMutations } from "@/contexts/vocabulary/useVocabularyDeletionMutations";
import { useVocabularyWordMutations } from "@/contexts/vocabulary/useVocabularyWordMutations";

type MutationOptions = {
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  setWords: Dispatch<SetStateAction<VocabularyWord[]>>;
  setCategories: Dispatch<SetStateAction<VocabularyCategoryRow[]>>;
  ownerIdRef: MutableRefObject<string | null>;
  refreshWords: () => Promise<void>;
};

export function useVocabularyMutations({
  words,
  categories,
  setWords,
  setCategories,
  ownerIdRef,
  refreshWords,
}: MutationOptions) {
  const categoryMutations = useVocabularyCategoryMutations({
    categories,
    setWords,
    setCategories,
    ownerIdRef,
  });
  const deletionMutations = useVocabularyDeletionMutations({
    words,
    setWords,
    ownerIdRef,
  });
  const wordMutations = useVocabularyWordMutations({
    words,
    setWords,
    ownerIdRef,
    refreshWords,
  });

  return {
    ...wordMutations,
    ...deletionMutations,
    ...categoryMutations,
  };
}
