import { invalidateQuizHistoryCache } from "@/lib/supabase/quiz-history-cache.mjs";

export {
  getCachedVocabularyQuizAnswers,
  getCachedVocabularyQuizHistory,
  getVocabularyQuizAnswers,
  getVocabularyQuizHistory,
} from "@/lib/supabase/quiz-queries";
export { saveVocabularyQuizSession } from "@/lib/supabase/quiz-mutations";
export type {
  SaveVocabularyQuizAnswer,
  SaveVocabularyQuizSession,
} from "@/lib/supabase/quiz-mutations";

export function invalidateVocabularyQuizHistoryCache(userId?: string): void {
  if (userId) {
    invalidateQuizHistoryCache(userId);
  } else {
    invalidateQuizHistoryCache();
  }
}
