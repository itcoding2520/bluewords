export {
  getVocabularyWordById,
  getVocabularyWordImagePaths,
  getVocabularyWordPage,
  getVocabularyWords,
  getVocabularyWordsForCategory,
} from "@/lib/supabase/vocabulary-queries";
export {
  addVocabularyWord,
  deleteVocabularyWord,
  deleteVocabularyWords,
  updateVocabularyWord,
  updateVocabularyWordWithMeanings,
} from "@/lib/supabase/vocabulary-mutations";
export type {
  VocabularyWordPage,
  VocabularyWordWithMeaningsRow,
} from "@/lib/supabase/vocabulary-types";
