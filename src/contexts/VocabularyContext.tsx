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
  addVocabularyWord,
  updateVocabularyWord,
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
import { deleteVocabularyImages } from "@/lib/supabase/vocabulary-images";
import { fetchEnglishIpa } from "@/lib/dictionary";
import { invalidateLatestVocabularyReviewsCache } from "@/lib/supabase/reviews";
import { toast } from "sonner";

interface VocabularyContextValue {
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  isLoaded: boolean;
  addWord: (word: VocabularyWord) => Promise<boolean>;
  updateWord: (word: VocabularyWord) => Promise<boolean>;
  deleteWord: (id: string) => Promise<boolean>;
  deleteWords: (ids: string[]) => Promise<number>;
  toggleMastered: (id: string) => Promise<boolean>;
  refreshWords: () => Promise<void>;
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
    words: VocabularyCsvWord[]
  ) => Promise<{
    imported: number;
    duplicates: number;
    failed: number;
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

  const requestIdRef = useRef(0);
  const ownerIdRef = useRef<string | null>(null);
  const mountedRef = useRef(false);
  const loadedOwnerIdRef = useRef<string | null>(null);

  const refreshWords = useCallback(async (): Promise<void> => {
    const currentRequest = ++requestIdRef.current;

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
        loadedOwnerIdRef.current = null;
        setWords([]);
        setCategories([]);
        setIsLoaded(true);
        return;
      }

      if (ownerIdRef.current !== user.id) {
        ownerIdRef.current = user.id;
        loadedOwnerIdRef.current = null;
        setWords([]);
        setCategories([]);
        setIsLoaded(false);
      }

      const [rows, categoryRows] = await Promise.all([
        getVocabularyWords(),
        getVocabularyCategories(),
      ]);

      if (
        !mountedRef.current ||
        currentRequest !== requestIdRef.current
      ) {
        return;
      }

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (
        !mountedRef.current ||
        currentRequest !== requestIdRef.current
      ) {
        return;
      }

      if (currentUser?.id !== user.id) {
        ownerIdRef.current = null;
        loadedOwnerIdRef.current = null;
        setWords([]);
        setCategories([]);
        setIsLoaded(false);
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

      loadedOwnerIdRef.current = user.id;
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
    }
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    const requestId = requestIdRef;

    mountedRef.current = true;

    const initialLoadTimer = setTimeout(() => {
      if (!cancelled) {
        void refreshWords();
      }
    }, 0);

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

      if (
        nextUserId !== null &&
        nextUserId === ownerIdRef.current &&
        loadedOwnerIdRef.current === nextUserId
      ) {
        return;
      }

      requestIdRef.current++;

      ownerIdRef.current = nextUserId;
      loadedOwnerIdRef.current = null;

      setWords([]);
      setCategories([]);
      setIsLoaded(false);

      if (nextUserId === null) {
        setIsLoaded(true);
        return;
      }

      setTimeout(() => {
        if (!cancelled) {
          void refreshWords();
        }
      }, 0);
    });

    return () => {
      cancelled = true;
      mountedRef.current = false;

      requestId.current++;

      clearTimeout(initialLoadTimer);
      subscription.unsubscribe();
    };
  }, [supabase, refreshWords]);

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
      const type = updatedWord.type ?? "word";
      const wordChanged = currentWord?.word.trim().toLowerCase() !== updatedWord.word.trim().toLowerCase();
      const ipa = type !== "word"
        ? null
        : updatedWord.ipa?.trim() || (wordChanged || !currentWord?.ipa
          ? await fetchEnglishIpa(updatedWord.word)
          : currentWord.ipa);
      const row = await updateVocabularyWord(updatedWord.id, {
        word: updatedWord.word,
        meaning: updatedWord.meaning,
        category: updatedWord.category,
        status: updatedWord.status,
        type,
        ipa,
        image_path: updatedWord.imagePath ?? null,
      });

      const savedMeanings = await saveVocabularyMeanings(
        updatedWord.id,
        updatedWord.detailedMeanings ??
          currentWord?.detailedMeanings ??
          []
      );

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
      invalidateLatestVocabularyReviewsCache();

      if (currentWord?.imagePath && currentWord.imagePath !== row.image_path) {
        void deleteVocabularyImages([currentWord.imagePath]).catch((error) =>
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

    if (!word) return false;

    try {
      await deleteVocabularyWord(id);

      if (word.imagePath) {
        void deleteVocabularyImages([word.imagePath]).catch((error) =>
          console.error("Could not remove vocabulary image:", error)
        );
      }

      setWords((current) =>
        current.filter((item) => item.id !== id)
      );
      invalidateLatestVocabularyReviewsCache();

      toast.success(`"${word.word}" deleted successfully!`);
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
      const deletedIds = await deleteVocabularyWords(uniqueIds);
      const deletedSet = new Set(deletedIds);
      const deletedImagePaths = words
        .filter((word) => deletedSet.has(word.id))
        .map((word) => word.imagePath);

      if (deletedImagePaths.some(Boolean)) {
        void deleteVocabularyImages(deletedImagePaths).catch((error) =>
          console.error("Could not remove deleted vocabulary images:", error)
        );
      }

      setWords((current) =>
        current.filter((word) => !deletedSet.has(word.id))
      );
      invalidateLatestVocabularyReviewsCache();

      return deletedIds.length;
    } catch (error) {
      console.error("Supabase deleteWords error:", error);
      toast.error("Failed to delete selected words.");
      return 0;
    }
  }

  async function toggleMastered(id: string): Promise<boolean> {
    const word = words.find((item) => item.id === id);

    if (!word) return false;

    const nextStatus =
      word.status === "mastered" ? "learning" : "mastered";

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
    importedWords: VocabularyCsvWord[]
  ): Promise<{
    imported: number;
    duplicates: number;
    failed: number;
    limitExceeded?: boolean;
  }> {
    if (importedWords.length > MAX_VOCABULARY_IMPORT_WORDS) {
      return {
        imported: 0,
        duplicates: 0,
        failed: 0,
        limitExceeded: true,
      };
    }

    let imported = 0;
    let duplicates = 0;
    let failed = 0;
    let nextIndex = 0;
    const savedWords: VocabularyWord[] = [];

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

          savedWords.push({
            id: row.id,
            word: row.word,
            meaning: row.meaning,
            category: row.category,
            status: row.status,
            type: row.type ?? "word",
            ipa: row.ipa ?? null,
            imagePath: row.image_path ?? null,
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

    if (savedWords.length) {
      setWords((current) => [...savedWords.reverse(), ...current]);
    }

    return { imported, duplicates, failed };
  }

  return (
    <VocabularyContext.Provider
      value={{
        words,
        categories,
        isLoaded,
        addWord,
        updateWord,
        deleteWord,
        deleteWords,
        toggleMastered,
        refreshWords,
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

export function useVocabulary() {
  const context = useContext(VocabularyContext);

  if (!context) {
    throw new Error(
      "useVocabulary must be used within VocabularyProvider"
    );
  }

  return context;
}
