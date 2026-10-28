"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { VocabularyWord } from "@/data/vocabulary";
import { getVocabularyWords } from "@/lib/supabase/vocabulary";
import {
  getVocabularyCategoriesForUser,
  type VocabularyCategoryColor,
  type VocabularyCategoryRow,
  type VocabularyCategoryUpdate,
} from "@/lib/supabase/categories";
import { defaultVocabularyCategories, defaultVocabularyWords } from "@/data/default-vocabulary";
import {
  loadPublicSharedVocabulary,
  mapPublicCategories,
  mapPublicWords,
  mapVocabularyWordRow,
  sortCategories,
} from "@/lib/vocabulary/shared-vocabulary";
import { type VocabularyCsvWord } from "@/lib/vocabulary-csv";
import { importVocabularyWords } from "@/lib/vocabulary/bulk-import";
import { useVocabularyMutations } from "@/contexts/vocabulary/useVocabularyMutations";
import { invalidateDashboardVocabularyOverviewCache } from "@/lib/supabase/dashboard-vocabulary";
import { invalidateVocabularyPageCache } from "@/lib/supabase/vocabulary-page-cache.mjs";
import { toast } from "sonner";

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
  const [supabase] = useState(() => createClient());
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [categories, setCategories] = useState<
    VocabularyCategoryRow[]
  >([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [authVersion, setAuthVersion] = useState(0);

  const requestIdRef = useRef(0);
  const pendingRequestIdRef = useRef<number | null>(null);
  const ownerIdRef = useRef<string | null>(null);
  const categoriesRequestIdRef = useRef(0);
  const mountedRef = useRef(false);

  const refreshCategories = useCallback(async (): Promise<void> => {
    const requestId = ++categoriesRequestIdRef.current;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
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
      const [rows, sharedResult] = await Promise.all([
        getVocabularyCategoriesForUser(user.id),
        supabase
          .from("community_categories")
          .select("id, owner_id, name, color, image_path, status, created_at, updated_at")
          .eq("status", "published"),
      ]);
      if (!mountedRef.current || requestId !== categoriesRequestIdRef.current) return;
      if (sharedResult.error) {
        console.error("Could not load published community categories:", sharedResult.error);
      }
      const publishedRows = (sharedResult.data ?? []) as Array<{ name: string; image_path: string | null }>;
      const categoriesWithSharedImages = rows.map((category) => ({
        ...category,
        image_path: publishedRows.find((item) => item.name.trim().toLocaleLowerCase() === category.name.trim().toLocaleLowerCase())?.image_path ?? category.image_path ?? null,
      }));
      const existingNames = new Set(categoriesWithSharedImages.map((item) => item.name.trim().toLocaleLowerCase()));
      const sharedCategories = ((sharedResult.data ?? []) as Array<{
        id: string;
        owner_id: string;
        name: string;
        color: VocabularyCategoryColor;
        image_path: string | null;
        created_at: string;
        updated_at: string;
      }>).filter((item) => !existingNames.has(item.name.trim().toLocaleLowerCase())).map((item) => ({
        id: `community-category-${item.id}`,
        user_id: item.owner_id,
        name: item.name,
        color: item.color,
        is_default: false,
        created_at: item.created_at,
        updated_at: item.updated_at,
        image_path: item.image_path,
      }));
      setCategories(sortCategories([...categoriesWithSharedImages, ...sharedCategories]));
      setCategoriesLoaded(true);
    } catch (error) {
      if (requestId !== categoriesRequestIdRef.current) return;
      console.error("Failed to refresh vocabulary categories:", error);
      setCategoriesLoaded(true);
      toast.error("Failed to load categories.");
    }
  }, [supabase]);

  const refreshWords = useCallback(async (): Promise<void> => {
    if (pendingRequestIdRef.current === requestIdRef.current) return;
    if (ownerIdRef.current) {
      invalidateDashboardVocabularyOverviewCache(ownerIdRef.current);
    }

    const currentRequest = ++requestIdRef.current;
    pendingRequestIdRef.current = currentRequest;

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (
        !mountedRef.current ||
        currentRequest !== requestIdRef.current
      ) {
        return;
      }

      if (authError || !user) {
        ownerIdRef.current = null;
        try {
          const shared = await loadPublicSharedVocabulary();
          if (!mountedRef.current || currentRequest !== requestIdRef.current) return;
          setWords([...defaultVocabularyWords, ...mapPublicWords(shared)]);
          setCategories(mapPublicCategories(shared));
        } catch (error) {
          console.error("Could not load guest shared vocabulary:", error);
          if (!mountedRef.current || currentRequest !== requestIdRef.current) return;
          setWords(defaultVocabularyWords);
          setCategories(defaultVocabularyCategories);
        }
        setIsAuthenticated(false);
        setCategoriesLoaded(true);
        setIsLoaded(true);
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

      const [rows, categoryRows] = await Promise.all([
        getVocabularyWords(),
        getVocabularyCategoriesForUser(user.id),
      ]);

      if (
        !mountedRef.current ||
        currentRequest !== requestIdRef.current
      ) {
        return;
      }

      const personalWords = rows.map(mapVocabularyWordRow);

      const { data: communityCategories, error: communityCategoriesError } = await supabase
        .from("community_categories")
          .select("id, owner_id, name, color, image_path, status, created_at, updated_at")
        .eq("status", "published");
      const { data: communityWords, error: communityWordsError } = await supabase
        .from("community_words")
        .select("id, word, meaning, ipa, community_categories!inner(id, name, color, status)")
        .eq("status", "published")
        .eq("community_categories.status", "published");

      if (communityCategoriesError || communityWordsError) {
        console.error("Could not load published community vocabulary:", communityCategoriesError ?? communityWordsError);
      }

      type CommunityCategory = { id: string; owner_id: string; name: string; color: VocabularyCategoryColor; image_path: string | null; status: string; created_at: string; updated_at: string };
      type CommunityWord = { id: string; word: string; meaning: string; ipa: string | null; community_categories: { id: string; name: string; color: VocabularyCategoryColor; status: string } };
      const publishedCategoryRows = (communityCategories ?? []) as CommunityCategory[];
      const categoryNames = new Set(categoryRows.map((item) => item.name.trim().toLocaleLowerCase()));
      const categoriesWithSharedImages = categoryRows.map((category) => ({
        ...category,
        image_path: publishedCategoryRows.find((item) => item.name.trim().toLocaleLowerCase() === category.name.trim().toLocaleLowerCase())?.image_path ?? category.image_path ?? null,
      }));
      const mergedCategories: VocabularyCategoryRow[] = [
        ...categoriesWithSharedImages,
        ...publishedCategoryRows.filter((item) => !categoryNames.has(item.name.trim().toLocaleLowerCase())).map((item) => ({
          id: `community-category-${item.id}`,
          user_id: item.owner_id,
          name: item.name,
          color: item.color,
          is_default: false,
          created_at: item.created_at,
          updated_at: item.updated_at,
          image_path: item.image_path,
        })),
      ];
      const personalKeys = new Set(personalWords.map((item) => `${item.category.trim().toLocaleLowerCase()}\u0000${item.word.trim().toLocaleLowerCase()}`));
      const sharedWords = ((communityWords ?? []) as unknown as CommunityWord[]).flatMap((item) => {
        const key = `${item.community_categories.name.trim().toLocaleLowerCase()}\u0000${item.word.trim().toLocaleLowerCase()}`;
        if (personalKeys.has(key)) return [];
        return [{
          id: `community-${item.id}`,
          word: item.word,
          meaning: item.meaning,
          category: item.community_categories.name,
          status: "learning" as const,
          type: "word" as const,
          ipa: item.ipa,
          imagePath: null,
          detailedMeanings: [],
          isCustom: true,
        }];
      });

      setWords([...personalWords, ...sharedWords]);
      setCategories(mergedCategories);
      setCategoriesLoaded(true);

      setIsLoaded(true);
    } catch (error) {
      if (
        !mountedRef.current ||
        currentRequest !== requestIdRef.current
      ) {
        return;
      }

      console.error("Failed to refresh vocabulary:", error);
      toast.error("Failed to load vocabulary.");

      setIsLoaded(true);
    } finally {
      if (pendingRequestIdRef.current === currentRequest) {
        pendingRequestIdRef.current = null;
      }
    }
  }, [supabase]);

  useEffect(() => {
    const requestId = requestIdRef;
    mountedRef.current = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event !== "INITIAL_SESSION" &&
        event !== "SIGNED_IN" &&
        event !== "SIGNED_OUT" &&
        event !== "USER_UPDATED"
      ) {
        return;
      }

      const nextUserId = session?.user.id ?? null;

      if (nextUserId === ownerIdRef.current) {
        return;
      }

      requestId.current++;
      categoriesRequestIdRef.current++;

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
  }, [supabase]);

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
