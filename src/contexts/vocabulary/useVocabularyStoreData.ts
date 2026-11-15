import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useCallback, useRef, useState } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import { defaultVocabularyCategories, defaultVocabularyWords } from "@/data/default-vocabulary";
import {
  loadAuthenticatedVocabularyView,
  loadGuestVocabularySnapshot,
} from "@/lib/supabase/vocabulary-store-snapshots";
import { invalidateDashboardVocabularyOverviewCache } from "@/lib/supabase/dashboard-vocabulary";
import { toast } from "sonner";
import { useVocabularyCategoryData } from "@/contexts/vocabulary/useVocabularyCategoryData";
import { useVocabularyStoreAuth } from "@/contexts/vocabulary/useVocabularyStoreAuth";

export function useVocabularyStoreData() {
  const supabase = useSupabaseClient();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const requestIdRef = useRef(0);
  const pendingRequestIdRef = useRef<number | null>(null);
  const ownerIdRef = useRef<string | null>(null);
  const mountedRef = useRef(false);
  const categoryData = useVocabularyCategoryData(supabase, mountedRef);
  const {
    categories,
    setCategories,
    categoriesLoaded,
    setCategoriesLoaded,
    refreshCategories,
    invalidatePendingRequests: invalidateCategoryRequests,
  } = categoryData;
  const auth = useVocabularyStoreAuth({
    supabase,
    setWords,
    setCategories,
    setCategoriesLoaded,
    setIsLoaded,
    invalidateCategoryRequests,
    requestIdRef,
    ownerIdRef,
    mountedRef,
  });
  const { isAuthenticated, setIsAuthenticated, authVersion } = auth;

  const refreshWords = useCallback(async (): Promise<void> => {
    if (pendingRequestIdRef.current === requestIdRef.current) return;
    if (ownerIdRef.current) invalidateDashboardVocabularyOverviewCache(ownerIdRef.current);

    const currentRequest = ++requestIdRef.current;
    pendingRequestIdRef.current = currentRequest;

    const isCurrentRequest = () =>
      mountedRef.current && currentRequest === requestIdRef.current;

    async function loadGuestWords() {
      ownerIdRef.current = null;
      setWords(defaultVocabularyWords);
      setCategories(defaultVocabularyCategories);
      setIsAuthenticated(false);
      setCategoriesLoaded(true);
      setIsLoaded(true);
      try {
        const snapshot = await loadGuestVocabularySnapshot();
        if (!isCurrentRequest()) return;
        setWords(snapshot.words);
        setCategories(snapshot.categories);
      } catch (error) {
        console.error("Could not load guest shared vocabulary:", error);
      }
    }

    async function loadMemberWords(userId: string) {
      setIsAuthenticated(true);
      if (ownerIdRef.current !== userId) {
        ownerIdRef.current = userId;
        setWords([]);
        setCategories([]);
        setCategoriesLoaded(false);
        setIsLoaded(false);
      }

      const result = await loadAuthenticatedVocabularyView(supabase, userId);
      if (!isCurrentRequest()) return;
      if (result.communityCategoriesError || result.communityWordsError) {
        console.error("Could not load published community vocabulary:", result.communityCategoriesError ?? result.communityWordsError);
      }
      setWords(result.words);
      setCategories(result.categories);
      setCategoriesLoaded(true);
      setIsLoaded(true);
    }

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!isCurrentRequest()) return;

      if (authError || !user) {
        await loadGuestWords();
        return;
      }

      await loadMemberWords(user.id);
    } catch (error) {
      if (!mountedRef.current || currentRequest !== requestIdRef.current) return;
      console.error("Failed to refresh vocabulary:", error);
      toast.error("Failed to load vocabulary.");
      setIsLoaded(true);
    } finally {
      if (pendingRequestIdRef.current === currentRequest) pendingRequestIdRef.current = null;
    }
  }, [setCategories, setCategoriesLoaded, setIsAuthenticated, supabase]);

  return {
    words,
    setWords,
    categories,
    setCategories,
    isLoaded,
    isAuthenticated,
    categoriesLoaded,
    authVersion,
    refreshWords,
    refreshCategories,
    ownerIdRef,
  };
}
