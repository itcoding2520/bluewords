import type { ReactNode } from "react";
import type { VocabularyCsvWord } from "@/lib/vocabulary-csv";
import { importVocabularyWords } from "@/lib/vocabulary/bulk-import";
import { useVocabularyMutations } from "@/contexts/vocabulary/useVocabularyMutations";
import { useVocabularyStoreData } from "@/contexts/vocabulary/useVocabularyStoreData";
import { VocabularyContext } from "@/contexts/vocabulary/context";
import { invalidateDashboardVocabularyOverviewCache } from "@/lib/supabase/dashboard-vocabulary";
import { invalidateVocabularyPageCache } from "@/lib/supabase/vocabulary-page-cache.mjs";

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

  async function importWords(
    importedWords: VocabularyCsvWord[],
    imageFilesByWord?: Map<string, File>
  ) {
    const result = await importVocabularyWords(importedWords, words, imageFilesByWord);

    if (result.importedWords.length > 0) {
      setWords((current) => [...result.importedWords, ...current]);
    }
    if (result.existingImageUpdates.length > 0) {
      const imagePaths = new Map(result.existingImageUpdates.map(({ id, imagePath }) => [id, imagePath]));
      setWords((current) => current.map((word) => {
        const imagePath = imagePaths.get(word.id);
        return imagePath ? { ...word, imagePath } : word;
      }));
    }
    if (result.imported > 0 || result.existingImageUpdates.length > 0) {
      invalidateVocabularyPageCache();
      invalidateDashboardVocabularyOverviewCache(ownerIdRef.current ?? undefined);
    }

    return {
      imported: result.imported,
      duplicates: result.duplicates,
      failed: result.failed,
      imagesUploaded: result.imagesUploaded,
      imagesFailed: result.imagesFailed,
      limitExceeded: result.limitExceeded,
    };
  }

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
        importWords,
      }}
    >
      {children}
    </VocabularyContext.Provider>
  );
}
