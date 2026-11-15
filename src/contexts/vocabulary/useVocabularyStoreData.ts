import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useCallback, useEffect, useRef, useState } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import { defaultVocabularyCategories, defaultVocabularyWords } from "@/data/default-vocabulary";
import {
  loadPublicSharedVocabulary,
  mapPublicCategories,
  mapPublicWords,
} from "@/lib/vocabulary/shared-vocabulary";
import { loadAuthenticatedVocabularySnapshot, mapAuthenticatedVocabularySnapshot } from "@/lib/supabase/vocabulary-store";
import { invalidateDashboardVocabularyOverviewCache } from "@/lib/supabase/dashboard-vocabulary";
import { toast } from "sonner";
import { useVocabularyCategoryData } from "@/contexts/vocabulary/useVocabularyCategoryData";

export function useVocabularyStoreData() {
  const supabase = useSupabaseClient();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authVersion, setAuthVersion] = useState(0);

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

  const refreshWords = useCallback(async (): Promise<void> => {
    if (pendingRequestIdRef.current === requestIdRef.current) return;
    if (ownerIdRef.current) invalidateDashboardVocabularyOverviewCache(ownerIdRef.current);

    const currentRequest = ++requestIdRef.current;
    pendingRequestIdRef.current = currentRequest;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!mountedRef.current || currentRequest !== requestIdRef.current) return;

      if (authError || !user) {
        ownerIdRef.current = null;
        setWords(defaultVocabularyWords);
        setCategories(defaultVocabularyCategories);
        setIsAuthenticated(false);
        setCategoriesLoaded(true);
        setIsLoaded(true);
        try {
          const shared = await loadPublicSharedVocabulary();
          if (!mountedRef.current || currentRequest !== requestIdRef.current) return;
          setWords([...defaultVocabularyWords, ...mapPublicWords(shared)]);
          setCategories(mapPublicCategories(shared));
        } catch (error) {
          console.error("Could not load guest shared vocabulary:", error);
        }
        return;
      }

      setIsAuthenticated(true);
      if (ownerIdRef.current !== user.id) {
        ownerIdRef.current = user.id;
        setWords([]);
        setCategories([]);
        setCategoriesLoaded(false);
        setIsLoaded(false);
      }

      const result = await loadAuthenticatedVocabularySnapshot(supabase, user.id);

      if (!mountedRef.current || currentRequest !== requestIdRef.current) return;
      if (result.communityCategoriesError || result.communityWordsError) {
        console.error("Could not load published community vocabulary:", result.communityCategoriesError ?? result.communityWordsError);
      }
      const mappedVocabulary = mapAuthenticatedVocabularySnapshot(result);
      setWords(mappedVocabulary.words);
      setCategories(mappedVocabulary.categories);
      setCategoriesLoaded(true);
      setIsLoaded(true);
    } catch (error) {
      if (!mountedRef.current || currentRequest !== requestIdRef.current) return;
      console.error("Failed to refresh vocabulary:", error);
      toast.error("Failed to load vocabulary.");
      setIsLoaded(true);
    } finally {
      if (pendingRequestIdRef.current === currentRequest) pendingRequestIdRef.current = null;
    }
  }, [setCategories, setCategoriesLoaded, supabase]);

  useEffect(() => {
    const requestId = requestIdRef;
    mountedRef.current = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "INITIAL_SESSION" && event !== "SIGNED_IN"
        && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      const nextUserId = session?.user.id ?? null;
      if (nextUserId === ownerIdRef.current) return;

      requestId.current++;
      invalidateCategoryRequests();
      ownerIdRef.current = nextUserId;
      invalidateDashboardVocabularyOverviewCache();
      setAuthVersion((version) => version + 1);
      setIsAuthenticated(Boolean(nextUserId));
      setWords(nextUserId ? [] : defaultVocabularyWords);
      setCategories(nextUserId ? [] : defaultVocabularyCategories);
      setCategoriesLoaded(nextUserId === null);
      setIsLoaded(nextUserId === null);
    });

    return () => {
      mountedRef.current = false;
      requestId.current++;
      subscription.unsubscribe();
    };
  }, [invalidateCategoryRequests, setCategories, setCategoriesLoaded, supabase]);

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
