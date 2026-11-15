import { useContext, useEffect } from "react";
import { VocabularyContext } from "@/contexts/vocabulary/context";

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
    throw new Error("useVocabulary must be used within VocabularyProvider");
  }

  return context;
}
