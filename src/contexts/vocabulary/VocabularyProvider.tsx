import type { ReactNode } from "react";
import { useVocabularyMutations } from "@/contexts/vocabulary/useVocabularyMutations";
import { useVocabularyStoreData } from "@/contexts/vocabulary/useVocabularyStoreData";
import { VocabularyContext } from "@/contexts/vocabulary/context";
import { useVocabularyImportMutations } from "@/contexts/vocabulary/useVocabularyImportMutations";

export function VocabularyProvider({ children }: { children: ReactNode }) {
  return <VocabularyStoreProvider>{children}</VocabularyStoreProvider>;
}

function VocabularyStoreProvider({ children }: { children: ReactNode }) {
  const {
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
  } = useVocabularyStoreData();

  const mutations = useVocabularyMutations({
    words,
    categories,
    setWords,
    setCategories,
    ownerIdRef,
    refreshWords,
  });
  const importMutations = useVocabularyImportMutations({ words, setWords, ownerIdRef });

  return (
    <VocabularyContext.Provider
      value={{
        words,
        categories,
        isLoaded,
        isAuthenticated,
        categoriesLoaded,
        authVersion,
        ...mutations,
        refreshWords,
        refreshCategories,
        ...importMutations,
      }}
    >
      {children}
    </VocabularyContext.Provider>
  );
}
