import { useCallback, useRef, useState, type MutableRefObject } from "react";

import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { defaultVocabularyCategories } from "@/data/default-vocabulary";
import type { SupabaseClient } from "@/lib/supabase/client";
import { loadAuthenticatedVocabularyCategories } from "@/lib/supabase/vocabulary-store";
import { mapAuthenticatedVocabularyCategories } from "@/lib/supabase/vocabulary-store-mapping";
import { loadPublicSharedVocabulary, mapPublicCategories } from "@/lib/vocabulary/public-shared-vocabulary";
import { toast } from "sonner";


export function useVocabularyCategoryData(
  supabase: SupabaseClient,
  mountedRef: MutableRefObject<boolean>
) {
  const [categories, setCategories] = useState<VocabularyCategoryRow[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const categoriesRequestIdRef = useRef(0);

  const refreshCategories = useCallback(async (): Promise<void> => {
    const requestId = ++categoriesRequestIdRef.current;
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      if (authError || !user) {
        if (!mountedRef.current || requestId !== categoriesRequestIdRef.current) return;
        try {
          const shared = await loadPublicSharedVocabulary();
          if (!mountedRef.current || requestId !== categoriesRequestIdRef.current) return;
          setCategories(mapPublicCategories(shared));
        } catch (error) {
          console.error("Could not load guest shared categories:", error);
          setCategories(defaultVocabularyCategories);
        }
        setCategoriesLoaded(true);
        return;
      }

      const result = await loadAuthenticatedVocabularyCategories(supabase, user.id);
      if (!mountedRef.current || requestId !== categoriesRequestIdRef.current) return;
      if (result.error) {
        console.error("Could not load published community categories:", result.error);
      }
      setCategories(mapAuthenticatedVocabularyCategories(result));
      setCategoriesLoaded(true);
    } catch (error) {
      if (requestId !== categoriesRequestIdRef.current) return;
      console.error("Failed to refresh vocabulary categories:", error);
      setCategoriesLoaded(true);
      toast.error("Failed to load categories.");
    }
  }, [mountedRef, supabase]);

  const invalidatePendingRequests = useCallback(() => {
    categoriesRequestIdRef.current++;
  }, []);

  return {
    categories,
    setCategories,
    categoriesLoaded,
    setCategoriesLoaded,
    refreshCategories,
    invalidatePendingRequests,
  };
}
