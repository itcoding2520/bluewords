import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import { defaultVocabularyCategories, defaultVocabularyWords } from "@/data/default-vocabulary";
import { invalidateDashboardVocabularyOverviewCache } from "@/lib/supabase/dashboard-vocabulary";
import {
  loadAuthenticatedVocabularyView,
  loadGuestVocabularySnapshot,
} from "@/lib/supabase/vocabulary-store-snapshots";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { SupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function useVocabularyStoreRefresh(input: {
  supabase: SupabaseClient;
  setWords: Dispatch<SetStateAction<VocabularyWord[]>>;
  setCategories: Dispatch<SetStateAction<VocabularyCategoryRow[]>>;
  setCategoriesLoaded: Dispatch<SetStateAction<boolean>>;
  setIsLoaded: Dispatch<SetStateAction<boolean>>;
  setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
  requestIdRef: MutableRefObject<number>;
  pendingRequestIdRef: MutableRefObject<number | null>;
  ownerIdRef: MutableRefObject<string | null>;
  mountedRef: MutableRefObject<boolean>;
}) {
  const {
    supabase,
    setWords,
    setCategories,
    setCategoriesLoaded,
    setIsLoaded,
    setIsAuthenticated,
    requestIdRef,
    pendingRequestIdRef,
    ownerIdRef,
    mountedRef,
  } = input;

  return useCallback(async (): Promise<void> => {
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
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      const user = session?.user ?? null;
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
  }, [
    mountedRef,
    ownerIdRef,
    pendingRequestIdRef,
    requestIdRef,
    setCategories,
    setCategoriesLoaded,
    setIsAuthenticated,
    setIsLoaded,
    setWords,
    supabase,
  ]);
}
