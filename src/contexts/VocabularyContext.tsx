
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { VocabularyWord } from "@/data/vocabulary";
import {
  getVocabularyWords,
  addVocabularyWord,
  updateVocabularyWord,
  deleteVocabularyWord,
} from "@/lib/supabase/vocabulary";
import { toast } from "sonner";

interface VocabularyContextValue {
  words: VocabularyWord[];
  isLoaded: boolean;
  addWord: (word: VocabularyWord) => Promise<boolean>;
  updateWord: (word: VocabularyWord) => Promise<boolean>;
  deleteWord: (id: string) => Promise<boolean>;
  toggleMastered: (id: string) => Promise<boolean>;
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
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadWords() {
      try {
        const rows = await getVocabularyWords();

        if (!cancelled) {
          setWords(
            rows.map(({ id, word, meaning, category, status }) => ({
              id,
              word,
              meaning,
              category,
              status,
            }))
          );
        }
      } catch {
        if (!cancelled) {
          toast.error("Failed to load vocabulary.");
        }
      } finally {
        if (!cancelled) {
          setIsLoaded(true);
        }
      }
    }

    void loadWords();

    return () => {
      cancelled = true;
    };
  }, []);

  async function addWord(word: VocabularyWord): Promise<boolean> {
    try {
      const row = await addVocabularyWord({
        word: word.word,
        meaning: word.meaning,
        category: word.category,
        status: word.status,
      });

      setWords((current) => [
        {
          id: row.id,
          word: row.word,
          meaning: row.meaning,
          category: row.category,
          status: row.status,
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
      });

      setWords((current) =>
        current.map((word) =>
          word.id === row.id
            ? {
                id: row.id,
                word: row.word,
                meaning: row.meaning,
                category: row.category,
                status: row.status,
              }
            : word
        )
      );

      toast.success(`"${row.word}" updated successfully!`);
      return true;
    } catch {
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
