import { getErrorMessage } from "@/lib/errors";
import { useEffect, useState, type SetStateAction } from "react";
import type { SupabaseClient } from "@/lib/supabase/client";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { getCommunityContentStatus, loadAdminCategoryWords } from "@/lib/admin-category-data";
import type { CategoryTab, CommunityCategory, CommunityWord } from "@/lib/admin-category-data";
import { getSharedAdminCategory } from "@/lib/admin-category-management-view";
import { scheduleDeferredTask } from "@/lib/schedule-deferred-task";
import { updateStateField } from "@/lib/state-action";

type SelectedCategory = CommunityCategory | VocabularyCategoryRow;

export function useAdminCategoryWordsData(
  supabase: SupabaseClient,
  activeTab: CategoryTab,
  selectedCategory: SelectedCategory | null,
  publishedCategoriesByName: Map<string, CommunityCategory>,
  setError: (error: string) => void
) {
  const [snapshot, setSnapshot] = useState<{ words: CommunityWord[]; emails: Record<string, string> }>({
    words: [],
    emails: {},
  });
  const [wordsLoading, setWordsLoading] = useState(false);
  const { words, emails: wordEmails } = snapshot;
  const setWords = (action: SetStateAction<CommunityWord[]>) => updateStateField(setSnapshot, "words", action);

  useEffect(() => {
    if (!selectedCategory) return;
    const sharedCategory = getSharedAdminCategory(activeTab, selectedCategory, publishedCategoriesByName) ?? null;
    if (!sharedCategory) {
      return scheduleDeferredTask(() => {
        setSnapshot({ words: [], emails: {} });
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
        setSnapshot(result);
      } catch (cause) {
        if (cancelled) return;
        setError(getErrorMessage(cause, "Could not load words."));
        setSnapshot({ words: [], emails: {} });
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
