import { getErrorMessage } from "@/lib/errors";
import { useEffect, useState } from "react";
import type { SupabaseClient } from "@/lib/supabase/client";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { getCommunityContentStatus, loadAdminCategoryWords } from "@/lib/admin-category-data";
import type { CategoryTab, CommunityCategory, CommunityWord } from "@/lib/admin-category-data";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";
import { scheduleDeferredTask } from "@/lib/schedule-deferred-task";

type SelectedCategory = CommunityCategory | VocabularyCategoryRow;

export function useAdminCategoryWordsData(
  supabase: SupabaseClient,
  activeTab: CategoryTab,
  selectedCategory: SelectedCategory | null,
  publishedCategoriesByName: Map<string, CommunityCategory>,
  setError: (error: string) => void
) {
  const [words, setWords] = useState<CommunityWord[]>([]);
  const [wordEmails, setWordEmails] = useState<Record<string, string>>({});
  const [wordsLoading, setWordsLoading] = useState(false);

  useEffect(() => {
    if (!selectedCategory) return;
    const sharedCategory = activeTab === "default"
      ? publishedCategoriesByName.get(normalizeVocabularyLabel(selectedCategory.name)) ?? null
      : "owner_id" in selectedCategory ? selectedCategory : null;
    if (!sharedCategory) {
      return scheduleDeferredTask(() => {
        setWords([]);
        setWordEmails({});
        setWordsLoading(false);
      });
    }

    let cancelled = false;
    const loadWords = async () => {
      setWordsLoading(true);
      setError("");
      try {
        const result = await loadAdminCategoryWords(
          supabase,
          sharedCategory,
          getCommunityContentStatus(activeTab)
        );
        if (cancelled) return;
        setWords(result.words);
        setWordEmails(result.emails);
      } catch (cause) {
        if (cancelled) return;
        setError(getErrorMessage(cause, "Could not load words."));
        setWords([]);
        setWordEmails({});
      }
      setWordsLoading(false);
    };
    const cancelScheduledLoad = scheduleDeferredTask(() => { void loadWords(); });
    return () => {
      cancelled = true;
      cancelScheduledLoad();
    };
  }, [activeTab, publishedCategoriesByName, selectedCategory, setError, supabase]);

  return { words, setWords, wordEmails, wordsLoading };
}
