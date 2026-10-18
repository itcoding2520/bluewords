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
  getVocabularyMeanings,
  addVocabularyMeaning,
  updateVocabularyMeaning,
  deleteVocabularyMeaning,
} from "@/lib/supabase/vocabulary";
import type { VocabularyMeaningRow } from "@/types/database";
import { toast } from "sonner";

interface VocabularyContextValue {
  words: VocabularyWord[];
  isLoaded: boolean;
  addWord: (word: VocabularyWord) => Promise<boolean>;
  updateWord: (word: VocabularyWord) => Promise<boolean>;
  deleteWord: (id: string) => Promise<boolean>;
  toggleMastered: (id: string) => Promise<boolean>;
  refreshWords: () => Promise<void>;
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
        setIsLoaded(true);
        return;
      }

      if (ownerIdRef.current !== user.id) {
        ownerIdRef.current = user.id;
        loadedOwnerIdRef.current = null;
        setWords([]);
        setIsLoaded(false);
      }

      const rows = await getVocabularyWords();

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
            image_path,
            vocabulary_meanings,
          }) => ({
            id,
            word,
            meaning,
            category,
            status,
            type: type ?? "word",
            imagePath: image_path ?? null,
            detailedMeanings: (vocabulary_meanings ?? []).map(
              mapVocabularyMeaning
            ),
          })
        )
      );

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
      const row = await addVocabularyWord({
        word: word.word,
        meaning: word.meaning,
        category: word.category,
        status: word.status,
        type: word.type ?? "word",
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
      const row = await updateVocabularyWord(updatedWord.id, {
        word: updatedWord.word,
        meaning: updatedWord.meaning,
        category: updatedWord.category,
        status: updatedWord.status,
        type: updatedWord.type ?? "word",
        image_path: updatedWord.imagePath ?? null,
      });

      const currentWord = words.find(
        (word) => word.id === updatedWord.id
      );

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
                imagePath: row.image_path ?? null,
                detailedMeanings: savedMeanings,
              }
            : word
        )
      );

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

      setWords((current) =>
        current.filter((item) => item.id !== id)
      );

      toast.success(`"${word.word}" deleted successfully!`);
      return true;
    } catch {
      toast.error("Failed to delete word.");
      return false;
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

  return (
    <VocabularyContext.Provider
      value={{
        words,
        isLoaded,
        addWord,
        updateWord,
        deleteWord,
        toggleMastered,
        refreshWords,
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