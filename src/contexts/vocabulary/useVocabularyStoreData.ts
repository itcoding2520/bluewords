import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useRef, useState } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import { useVocabularyCategoryData } from "@/contexts/vocabulary/useVocabularyCategoryData";
import { useVocabularyStoreAuth } from "@/contexts/vocabulary/useVocabularyStoreAuth";
import { useVocabularyStoreRefresh } from "@/contexts/vocabulary/useVocabularyStoreRefresh";

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

  const refreshWords = useVocabularyStoreRefresh({
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
  });

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
