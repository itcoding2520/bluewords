"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import {
  type VocabularyCategoryColor,
  type VocabularyCategoryRow,
  type VocabularyCategoryUpdate,
} from "@/lib/supabase/categories";
import { type VocabularyCsvWord } from "@/lib/vocabulary-csv";
import { importVocabularyWords } from "@/lib/vocabulary/bulk-import";
import { useVocabularyMutations } from "@/contexts/vocabulary/useVocabularyMutations";
import { useVocabularyStoreData } from "@/contexts/vocabulary/useVocabularyStoreData";
import { invalidateDashboardVocabularyOverviewCache } from "@/lib/supabase/dashboard-vocabulary";
import { invalidateVocabularyPageCache } from "@/lib/supabase/vocabulary-page-cache.mjs";

interface VocabularyContextValue {
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  isLoaded: boolean;
  isAuthenticated: boolean;
  categoriesLoaded: boolean;
  authVersion: number;
  addWord: (word: VocabularyWord) => Promise<boolean>;
  updateWord: (word: VocabularyWord) => Promise<boolean>;
  deleteWord: (id: string) => Promise<boolean>;
  deleteWords: (ids: string[]) => Promise<number>;
  toggleMastered: (id: string, currentStatus?: VocabularyWord["status"]) => Promise<boolean>;
  refreshWords: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  addCategory: (input: {
    id?: string;
    name: string;
    color: VocabularyCategoryColor;
    image_path?: string | null;
  }) => Promise<VocabularyCategoryRow | null>;
  updateCategory: (
    id: string,
    updates: VocabularyCategoryUpdate,
    options?: { silent?: boolean }
  ) => Promise<VocabularyCategoryRow | null>;
  deleteCategory: (id: string) => Promise<boolean>;
  importWords: (
    words: VocabularyCsvWord[],
    imageFilesByWord?: Map<string, File>
  ) => Promise<{
    imported: number;
    duplicates: number;
    failed: number;
    imagesUploaded: number;
    imagesFailed: number;
    limitExceeded?: boolean;
  }>;
}

const VocabularyContext =
  createContext<VocabularyContextValue | null>(null);

export function VocabularyProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <VocabularyStoreProvider>
      {children}
    </VocabularyStoreProvider>
  );
}

function VocabularyStoreProvider({
  children,
}: {
  children: ReactNode;
}) {
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

  const { addWord, updateWord, deleteWord, deleteWords, toggleMastered, addCategory, updateCategory, deleteCategory } = useVocabularyMutations({ words, categories, setWords, setCategories, ownerIdRef, refreshWords });

  async function importWords(
    importedWords: VocabularyCsvWord[],
    imageFilesByWord?: Map<string, File>
  ): Promise<{
    imported: number;
    duplicates: number;
    failed: number;
    imagesUploaded: number;
    imagesFailed: number;
    limitExceeded?: boolean;
  }> {
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
        addWord,
        updateWord,
        deleteWord,
        deleteWords,
        toggleMastered,
        refreshWords,
        refreshCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        importWords,
      }}
    >
      {children}
    </VocabularyContext.Provider>
  );
}

export function useVocabulary(options: {
  loadWords?: boolean;
  loadCategories?: boolean;
} = {}) {
  const context = useContext(VocabularyContext);
  const isLoaded = context?.isLoaded;
  const categoriesLoaded = context?.categoriesLoaded;
  const authVersion = context?.authVersion;
  const refreshWords = context?.refreshWords;
  const refreshCategories = context?.refreshCategories;
  const loadWords = options.loadWords ?? true;
  const loadCategories = options.loadCategories ?? loadWords;

  useEffect(() => {
    if (!loadWords || isLoaded !== false || !refreshWords) return;

    const loadTimer = setTimeout(() => {
      void refreshWords();
    }, 0);

    return () => clearTimeout(loadTimer);
  }, [authVersion, isLoaded, loadWords, refreshWords]);

  useEffect(() => {
    if (loadCategories || categoriesLoaded !== false || !refreshCategories) return;
    const loadTimer = setTimeout(() => void refreshCategories(), 0);
    return () => clearTimeout(loadTimer);
  }, [authVersion, categoriesLoaded, loadCategories, refreshCategories]);

  if (!context) {
    throw new Error(
      "useVocabulary must be used within VocabularyProvider"
    );
  }

  return context;
}
