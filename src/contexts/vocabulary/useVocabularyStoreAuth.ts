import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import { defaultVocabularyCategories, defaultVocabularyWords } from "@/data/default-vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { SupabaseClient } from "@/lib/supabase/client";
import { invalidateDashboardVocabularyOverviewCache } from "@/lib/supabase/dashboard-vocabulary";

type MutableRef<T> = { current: T };

export function useVocabularyStoreAuth(input: {
  supabase: SupabaseClient;
  setWords: Dispatch<SetStateAction<VocabularyWord[]>>;
  setCategories: Dispatch<SetStateAction<VocabularyCategoryRow[]>>;
  setCategoriesLoaded: Dispatch<SetStateAction<boolean>>;
  setIsLoaded: Dispatch<SetStateAction<boolean>>;
  invalidateCategoryRequests: () => void;
  requestIdRef: MutableRef<number>;
  ownerIdRef: MutableRef<string | null>;
  mountedRef: MutableRef<boolean>;
}) {
  const {
    supabase, setWords, setCategories, setCategoriesLoaded, setIsLoaded,
    invalidateCategoryRequests, requestIdRef, ownerIdRef, mountedRef,
  } = input;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authVersion, setAuthVersion] = useState(0);

  useEffect(() => {
    const requestId = requestIdRef;
    const mounted = mountedRef;
    mountedRef.current = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "INITIAL_SESSION" && event !== "SIGNED_IN"
        && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      const nextUserId = session?.user.id ?? null;
      if (nextUserId === ownerIdRef.current) return;

      requestIdRef.current++;
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
      mounted.current = false;
      requestId.current++;
      subscription.unsubscribe();
    };
  }, [invalidateCategoryRequests, requestIdRef, ownerIdRef, mountedRef, setCategories, setCategoriesLoaded, setIsLoaded, setWords, supabase]);

  return { isAuthenticated, setIsAuthenticated, authVersion };
}
