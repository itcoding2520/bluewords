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
import type {
  VocabularyMeaning,
  VocabularyWord,
} from "@/data/vocabulary";
import {
  getVocabularyWords,
  getVocabularyWordById,
  getVocabularyWordImagePaths,
  addVocabularyWord,
  updateVocabularyWord,
  updateVocabularyWordWithMeanings,
  deleteVocabularyWord,
  deleteVocabularyWords,
  getVocabularyMeanings,
  addVocabularyMeaning,
  updateVocabularyMeaning,
  deleteVocabularyMeaning,
} from "@/lib/supabase/vocabulary";
import {
  addVocabularyCategory,
  deleteVocabularyCategory,
  getVocabularyCategories,
  getVocabularyCategoriesForUser,
  updateVocabularyCategory,
  type VocabularyCategoryColor,
  type VocabularyCategoryRow,
  type VocabularyCategoryUpdate,
} from "@/lib/supabase/categories";
import type { VocabularyMeaningRow } from "@/types/database";
import {
  MAX_VOCABULARY_IMPORT_WORDS,
  type VocabularyCsvWord,
} from "@/lib/vocabulary-csv";
import {
  deleteVocabularyImages,
  uploadVocabularyImage,
} from "@/lib/supabase/vocabulary-images";
import { fetchEnglishIpa } from "@/lib/dictionary";
import {
  invalidateLatestVocabularyReviewsCache,
  invalidateVocabularyReviewScheduleCache,
} from "@/lib/supabase/reviews";
import { invalidateLearningAnalyticsCache } from "@/lib/supabase/learning-analytics";
import { invalidateDashboardVocabularyOverviewCache } from "@/lib/supabase/dashboard-vocabulary";
import { toast } from "sonner";

interface VocabularyContextValue {
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  isLoaded: boolean;
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
    name: string;
    color: VocabularyCategoryColor;
  }) => Promise<VocabularyCategoryRow | null>;
  updateCategory: (
    id: string,
    updates: VocabularyCategoryUpdate
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

function mapVocabularyMeaning(
  row: VocabularyMeaningRow
): VocabularyMeaning {
  return {
    id: row.id,
    partOfSpeech: row.part_of_speech,
    meaning: row.meaning,
  };
}

function sortCategories(
  categories: VocabularyCategoryRow[]
): VocabularyCategoryRow[] {
  return [...categories].sort((left, right) => {
    if (left.is_default !== right.is_default) {
      return left.is_default ? -1 : 1;
    }

    return left.name.localeCompare(right.name);
  });
}

async function saveVocabularyMeanings(
  vocabularyWordId: string,
  meanings: VocabularyMeaning[]
): Promise<VocabularyMeaning[]> {
  const existingMeanings =
    await getVocabularyMeanings(vocabularyWordId);

  const existingById = new Map(
    existingMeanings.map((meaning) => [meaning.id, meaning])
  );

  const retainedIds = new Set<string>();
  const savedMeanings: VocabularyMeaningRow[] = [];

  for (const meaning of meanings) {
    const trimmedMeaning = meaning.meaning.trim();

    if (!trimmedMeaning) {
      continue;
    }

    const existing =
      meaning.id !== undefined
        ? existingById.get(meaning.id)
        : undefined;

    const saved = existing
      ? await updateVocabularyMeaning(existing.id, {
          part_of_speech: meaning.partOfSpeech,
          meaning: trimmedMeaning,
        })
      : await addVocabularyMeaning({
          vocabulary_word_id: vocabularyWordId,
          part_of_speech: meaning.partOfSpeech,
          meaning: trimmedMeaning,
        });

    retainedIds.add(saved.id);
    savedMeanings.push(saved);
  }

  for (const existing of existingMeanings) {
    if (!retainedIds.has(existing.id)) {
      await deleteVocabularyMeaning(existing.id);
    }
  }

  return savedMeanings.map(mapVocabularyMeaning);
}

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
      const rows = await getVocabularyCategories();
      if (!mountedRef.current || requestId !== categoriesRequestIdRef.current) return;
      setCategories(rows);
      setCategoriesLoaded(true);
    } catch (error) {
      if (requestId !== categoriesRequestIdRef.current) return;
      console.error("Failed to refresh vocabulary categories:", error);
      setCategoriesLoaded(true);
      toast.error("Failed to load categories.");
    }
  }, []);

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
        setWords([]);
        setCategories([]);
        setCategoriesLoaded(true);
        setIsLoaded(true);
        return;
      }

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

      setWords(
        rows.map(
          ({
            id,
            word,
            meaning,
            category,
            status,
            type,
            ipa,
            image_path,
            vocabulary_meanings,
          }) => ({
            id,
            word,
            meaning,
            category,
            status,
            type: type ?? "word",
            ipa: ipa ?? null,
            imagePath: image_path ?? null,
            detailedMeanings: (vocabulary_meanings ?? []).map(
              mapVocabularyMeaning
            ),
          })
        )
      );
      setCategories(categoryRows);
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

      setWords([]);
      setCategories([]);
      setCategoriesLoaded(nextUserId === null);
      setIsLoaded(nextUserId === null);

    });

    return () => {
      mountedRef.current = false;

      requestId.current++;

      subscription.unsubscribe();
    };
  }, [supabase]);

  async function addWord(word: VocabularyWord): Promise<boolean> {
    try {
      const type = word.type ?? "word";
      const ipa = type === "word"
        ? word.ipa?.trim() || await fetchEnglishIpa(word.word)
        : null;
      const row = await addVocabularyWord({
        word: word.word,
        meaning: word.meaning,
        category: word.category,
        status: word.status,
        type,
        ipa,
        image_path: word.imagePath ?? null,
      });

      let savedMeanings: VocabularyMeaning[];

      try {
        savedMeanings = await saveVocabularyMeanings(
          row.id,
          word.detailedMeanings ?? []
        );
      } catch (error) {
        try {
          await deleteVocabularyWord(row.id);
        } catch (rollbackError) {
          console.error(
            "Failed to roll back vocabulary after meaning save error:",
            rollbackError
          );
        }

        throw error;
      }

      setWords((current) => [
        {
          id: row.id,
          word: row.word,
          meaning: row.meaning,
          category: row.category,
          status: row.status,
          type: row.type ?? "word",
          ipa: row.ipa ?? null,
          imagePath: row.image_path ?? null,
          detailedMeanings: savedMeanings,
        },
        ...current,
      ]);
      invalidateDashboardVocabularyOverviewCache(ownerIdRef.current ?? undefined);

      toast.success(`"${row.word}" added successfully!`);
      return true;
    } catch (error) {
      console.error("Supabase addWord error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add word."
      );

      return false;
    }
  }

  async function updateWord(
    updatedWord: VocabularyWord
  ): Promise<boolean> {
    try {
      const currentWord = words.find(
        (word) => word.id === updatedWord.id
      );
      const storedWord = currentWord ? null : await getVocabularyWordById(updatedWord.id);
      const previousImagePath = currentWord?.imagePath ?? storedWord?.image_path ?? null;
      const previousIpa = currentWord?.ipa ?? storedWord?.ipa ?? updatedWord.ipa;
      const type = updatedWord.type ?? "word";
      const wordChanged = (currentWord?.word ?? storedWord?.word ?? updatedWord.word).trim().toLowerCase() !== updatedWord.word.trim().toLowerCase();
      const ipa = type !== "word"
        ? null
        : updatedWord.ipa?.trim() || (wordChanged || !previousIpa
          ? await fetchEnglishIpa(updatedWord.word)
          : previousIpa);
      const { word: row, meanings: meaningRows } =
        await updateVocabularyWordWithMeanings({
          id: updatedWord.id,
          word: updatedWord.word,
          meaning: updatedWord.meaning,
          category: updatedWord.category,
          status: updatedWord.status,
          type,
          ipa,
          image_path: updatedWord.imagePath ?? null,
          meanings: (updatedWord.detailedMeanings ??
            currentWord?.detailedMeanings ?? [])
            .filter((item) => item.meaning.trim())
            .map((item) => ({
              part_of_speech: item.partOfSpeech,
              meaning: item.meaning.trim(),
            })),
        });
      const savedMeanings = meaningRows.map(mapVocabularyMeaning);

      setWords((current) =>
        current.map((word) =>
          word.id === row.id
            ? {
                id: row.id,
                word: row.word,
                meaning: row.meaning,
                category: row.category,
                status: row.status,
                type: row.type ?? "word",
                ipa: row.ipa ?? null,
                imagePath: row.image_path ?? null,
                detailedMeanings: savedMeanings,
              }
            : word
        )
      );
      invalidateDashboardVocabularyOverviewCache(ownerIdRef.current ?? undefined);
      invalidateLatestVocabularyReviewsCache();

      if (previousImagePath && previousImagePath !== row.image_path) {
        void deleteVocabularyImages([previousImagePath]).catch((error) =>
          console.error("Could not remove replaced vocabulary image:", error)
        );
      }

      toast.success(`"${row.word}" updated successfully!`);
      return true;
    } catch (error) {
      console.error("Supabase updateWord error:", error);
      await refreshWords();
      toast.error("Failed to update word.");
      return false;
    }
  }

  async function deleteWord(id: string): Promise<boolean> {
    const word = words.find((item) => item.id === id);

    try {
      const storedWord = word ? null : await getVocabularyWordById(id);
      await deleteVocabularyWord(id);

      const imagePath = word?.imagePath ?? storedWord?.image_path;
      if (imagePath) {
        void deleteVocabularyImages([imagePath]).catch((error) =>
          console.error("Could not remove vocabulary image:", error)
        );
      }

      setWords((current) =>
        current.filter((item) => item.id !== id)
      );
      invalidateDashboardVocabularyOverviewCache(ownerIdRef.current ?? undefined);
      invalidateLatestVocabularyReviewsCache();
      invalidateLearningAnalyticsCache();
      invalidateVocabularyReviewScheduleCache();

      toast.success(`"${word?.word ?? storedWord?.word ?? "Word"}" deleted successfully!`);
      return true;
    } catch {
      toast.error("Failed to delete word.");
      return false;
    }
  }

  async function deleteWords(ids: string[]): Promise<number> {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return 0;

    try {
      const imageRows = await getVocabularyWordImagePaths(uniqueIds);
      const deletedIds = await deleteVocabularyWords(uniqueIds);
      const deletedSet = new Set(deletedIds);
      const deletedImagePaths = imageRows
        .filter((word) => deletedSet.has(word.id))
        .map((word) => word.image_path);

      if (deletedImagePaths.some(Boolean)) {
        void deleteVocabularyImages(deletedImagePaths).catch((error) =>
          console.error("Could not remove deleted vocabulary images:", error)
        );
      }

      setWords((current) =>
        current.filter((word) => !deletedSet.has(word.id))
      );
      invalidateDashboardVocabularyOverviewCache(ownerIdRef.current ?? undefined);
      invalidateLatestVocabularyReviewsCache();
      invalidateLearningAnalyticsCache();
      invalidateVocabularyReviewScheduleCache();

      return deletedIds.length;
    } catch (error) {
      console.error("Supabase deleteWords error:", error);
      toast.error("Failed to delete selected words.");
      return 0;
    }
  }

  async function toggleMastered(id: string, currentStatus?: VocabularyWord["status"]): Promise<boolean> {
    const word = words.find((item) => item.id === id);

    const nextStatus =
      (word?.status ?? currentStatus) === "mastered" ? "learning" : "mastered";

    try {
      const row = await updateVocabularyWord(id, {
        status: nextStatus,
      });

      setWords((current) =>
        current.map((item) =>
          item.id === row.id
            ? { ...item, status: row.status }
            : item
        )
      );
      invalidateDashboardVocabularyOverviewCache(ownerIdRef.current ?? undefined);

      return true;
    } catch {
      toast.error("Failed to update word status.");
      return false;
    }
  }

  async function addCategory(input: {
    name: string;
    color: VocabularyCategoryColor;
  }): Promise<VocabularyCategoryRow | null> {
    try {
      const row = await addVocabularyCategory(input);

      setCategories((current) =>
        sortCategories([...current, row])
      );
      toast.success(`Category "${row.name}" added.`);
      return row;
    } catch (error) {
      console.error("Supabase addCategory error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add category."
      );
      return null;
    }
  }

  async function updateCategory(
    id: string,
    updates: VocabularyCategoryUpdate
  ): Promise<VocabularyCategoryRow | null> {
    const previous = categories.find((category) => category.id === id);

    if (!previous) return null;

    try {
      const row = await updateVocabularyCategory(id, updates);

      setCategories((current) =>
        sortCategories(
          current.map((category) =>
            category.id === row.id ? row : category
          )
        )
      );

      if (previous.name !== row.name) {
        setWords((current) =>
          current.map((word) =>
            word.category === previous.name
              ? { ...word, category: row.name }
              : word
          )
        );
      }
      invalidateDashboardVocabularyOverviewCache(ownerIdRef.current ?? undefined);
      invalidateLatestVocabularyReviewsCache();

      toast.success(`Category "${row.name}" updated.`);
      return row;
    } catch (error) {
      console.error("Supabase updateCategory error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update category."
      );
      return null;
    }
  }

  async function deleteCategory(id: string): Promise<boolean> {
    const category = categories.find((item) => item.id === id);

    if (!category || category.is_default) return false;

    try {
      await deleteVocabularyCategory(id);

      setCategories((current) =>
        current.filter((item) => item.id !== id)
      );
      setWords((current) =>
        current.map((word) =>
          word.category === category.name
            ? { ...word, category: "Uncategorized" }
            : word
        )
      );
      invalidateDashboardVocabularyOverviewCache(ownerIdRef.current ?? undefined);
      invalidateLatestVocabularyReviewsCache();

      toast.success(`Category "${category.name}" deleted.`);
      return true;
    } catch (error) {
      console.error("Supabase deleteCategory error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete category."
      );
      return false;
    }
  }

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
    if (importedWords.length > MAX_VOCABULARY_IMPORT_WORDS) {
      return {
        imported: 0,
        duplicates: 0,
        failed: 0,
        imagesUploaded: 0,
        imagesFailed: 0,
        limitExceeded: true,
      };
    }

    let imported = 0;
    let duplicates = 0;
    let failed = 0;
    let imagesUploaded = 0;
    let imagesFailed = 0;
    let nextIndex = 0;
    const savedWords: VocabularyWord[] = [];
    const savedExistingImages: Array<{ id: string; imagePath: string }> = [];

    async function importNext() {
      while (nextIndex < importedWords.length) {
        const word = importedWords[nextIndex++];
        let insertedId: string | null = null;

        try {
          const row = await addVocabularyWord({
            word: word.word,
            meaning: word.meaning,
            category: word.category,
            status: word.status,
            type: word.type ?? "word",
            ipa: (word.type ?? "word") === "word"
              ? word.ipa?.trim() || await fetchEnglishIpa(word.word)
              : null,
            image_path: word.imagePath ?? null,
          });
          insertedId = row.id;

          const detailedMeanings = await saveVocabularyMeanings(
            row.id,
            word.detailedMeanings ?? []
          );

          let imagePath = row.image_path ?? null;
          const imageKey = word.word
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .toLocaleLowerCase()
            .replace(/[^a-z0-9]/g, "");
          const imageFile = imageFilesByWord?.get(imageKey);

          if (imageFile) {
            let uploadedPath: string | null = null;
            try {
              uploadedPath = await uploadVocabularyImage(row.id, imageFile);
              const updatedRow = await updateVocabularyWord(row.id, {
                image_path: uploadedPath,
              });
              imagePath = updatedRow.image_path ?? uploadedPath;
              imagesUploaded++;
            } catch (imageError) {
              if (uploadedPath) {
                try {
                  await deleteVocabularyImages([uploadedPath]);
                } catch (cleanupError) {
                  console.error("Failed to clean up imported vocabulary image:", cleanupError);
                }
              }
              imagesFailed++;
              console.error("Failed to import vocabulary image:", word.word, imageError);
            }
          }

          savedWords.push({
            id: row.id,
            word: row.word,
            meaning: row.meaning,
            category: row.category,
            status: row.status,
            type: row.type ?? "word",
            ipa: row.ipa ?? null,
            imagePath,
            detailedMeanings,
          });
          imported++;
        } catch (error) {
          if (insertedId) {
            try {
              await deleteVocabularyWord(insertedId);
            } catch (rollbackError) {
              console.error(
                "Failed to roll back CSV import word:",
                word.word,
                rollbackError
              );
            }
          }

          const code =
            typeof error === "object" &&
            error !== null &&
            "code" in error
              ? error.code
              : null;

          if (code === "23505") duplicates++;
          else {
            failed++;
            console.error("Failed to import CSV vocabulary:", word.word, error);
          }
        }
      }
    }

    await Promise.all(
      Array.from(
        { length: Math.min(4, importedWords.length) },
        () => importNext()
      )
    );

    const importedWordKeys = new Set(savedWords.map((word) =>
      word.word.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase().replace(/[^a-z0-9]/g, "")
    ));
    const existingImageCandidates = [...(imageFilesByWord ?? new Map())].flatMap(([key, file]) => {
      if (importedWordKeys.has(key)) return [];
      const existingWord = words.find((word) => {
        const normalized = word.word.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
        return normalized === key && !word.imagePath;
      });
      return existingWord ? [{ word: existingWord, file }] : [];
    });
    let imageIndex = 0;

    async function importExistingImage() {
      while (imageIndex < existingImageCandidates.length) {
        const { word, file } = existingImageCandidates[imageIndex++];
        let uploadedPath: string | null = null;
        try {
          uploadedPath = await uploadVocabularyImage(word.id, file);
          const row = await updateVocabularyWord(word.id, { image_path: uploadedPath });
          savedExistingImages.push({ id: row.id, imagePath: row.image_path ?? uploadedPath });
          imagesUploaded++;
        } catch (imageError) {
          if (uploadedPath) {
            try {
              await deleteVocabularyImages([uploadedPath]);
            } catch (cleanupError) {
              console.error("Failed to clean up imported vocabulary image:", cleanupError);
            }
          }
          imagesFailed++;
          console.error("Failed to import image for existing vocabulary:", word.word, imageError);
        }
      }
    }

    await Promise.all(
      Array.from(
        { length: Math.min(4, existingImageCandidates.length) },
        () => importExistingImage()
      )
    );

    if (savedWords.length) {
      setWords((current) => [...savedWords.reverse(), ...current]);
    }
    if (savedExistingImages.length) {
      const imagePaths = new Map(savedExistingImages.map(({ id, imagePath }) => [id, imagePath]));
      setWords((current) => current.map((word) => {
        const imagePath = imagePaths.get(word.id);
        return imagePath ? { ...word, imagePath } : word;
      }));
    }

    if (imported > 0 || savedExistingImages.length > 0) {
      invalidateDashboardVocabularyOverviewCache(ownerIdRef.current ?? undefined);
    }

    return { imported, duplicates, failed, imagesUploaded, imagesFailed };
  }

  return (
    <VocabularyContext.Provider
      value={{
        words,
        categories,
        isLoaded,
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
