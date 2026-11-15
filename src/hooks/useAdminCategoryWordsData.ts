import { useEffect, useState } from "react";
import type { SupabaseClient } from "@/lib/supabase/client";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { loadAdminCategoryWords } from "@/lib/admin-category-data";
import type { CategoryTab, CommunityCategory, CommunityWord } from "@/lib/admin-category-data";

type SelectedCategory = CommunityCategory | VocabularyCategoryRow;

export function useAdminCategoryWordsData(
  supabase: SupabaseClient,
  activeTab: CategoryTab,
  selectedCategory: SelectedCategory | null,
  communityCategories: CommunityCategory[],
  setError: (error: string) => void
) {
  const [words, setWords] = useState<CommunityWord[]>([]);
  const [wordEmails, setWordEmails] = useState<Record<string, string>>({});
  const [wordsLoading, setWordsLoading] = useState(false);

  useEffect(() => {
    if (!selectedCategory) return;
    const sharedCategory = activeTab === "default"
      ? communityCategories.find((category) => category.status === "published"
        && category.name.trim().toLocaleLowerCase() === selectedCategory.name.trim().toLocaleLowerCase())
      : "owner_id" in selectedCategory ? selectedCategory : null;
    if (!sharedCategory) {
      const timer = window.setTimeout(() => {
        setWords([]);
        setWordEmails({});
        setWordsLoading(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;
    const loadWords = async () => {
      setWordsLoading(true);
      setError("");
      try {
        const result = await loadAdminCategoryWords(
          supabase,
          sharedCategory,
          activeTab === "pending" ? "pending" : "published"
        );
        if (cancelled) return;
        setWords(result.words);
        setWordEmails(result.emails);
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Could not load words.");
        setWords([]);
        setWordEmails({});
      }
      setWordsLoading(false);
    };
    const timer = window.setTimeout(() => { void loadWords(); }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeTab, communityCategories, selectedCategory, setError, supabase]);

  return { words, setWords, wordEmails, wordsLoading };
}
