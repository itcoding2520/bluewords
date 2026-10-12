"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useHasHydrated } from "@/hooks/useHasHydrated";

import {
  initialVocabulary,
  type VocabularyWord,
} from "@/data/vocabulary";

import {
  loadVocabulary,
  saveVocabulary,
} from "@/lib/storage";
import { toast } from "sonner";

interface VocabularyContextValue {
  words: VocabularyWord[];
  isLoaded: boolean;
  addWord: (word: VocabularyWord) => void;
  updateWord: (word: VocabularyWord) => void;
  deleteWord: (id: string) => void;
  toggleMastered: (id: string) => void;
}

const VocabularyContext =
  createContext<VocabularyContextValue | null>(null);

export function VocabularyProvider({
  children,
}: {
  children: ReactNode;
}) {
  const hasHydrated = useHasHydrated();

  if (!hasHydrated) {
    return null;
  }

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
  const [words, setWords] = useState<VocabularyWord[]>(() => {
    return loadVocabulary() ?? initialVocabulary;
  });

  useEffect(() => {
    saveVocabulary(words);
  }, [words]);

  function addWord(word: VocabularyWord) {
    setWords((currentWords) => [
      word,
      ...currentWords,
    ]);
    toast.success(`"${word.word}" added successfully!`);
  }

  function updateWord(updatedWord: VocabularyWord) {
    setWords((currentWords) =>
      currentWords.map((word) =>
        word.id === updatedWord.id
          ? updatedWord
          : word
      )
    );
    toast.success(`"${updatedWord.word}" updated successfully!`);
  }

  function deleteWord(id: string) {
    const deletedWord = words.find((word) => word.id === id);

    if (!deletedWord) return;

    setWords((currentWords) =>
      currentWords.filter((word) => word.id !== id)
    );
    toast.success(`"${deletedWord.word}" deleted successfully!`);
  }

  function toggleMastered(id: string) {
    setWords((currentWords) =>
      currentWords.map((word) =>
        word.id === id
          ? {
              ...word,
              status:
                word.status === "mastered"
                  ? "learning"
                  : "mastered",
            }
          : word
      )
    );
  }

  return (
    <VocabularyContext.Provider
      value={{
        words,
        isLoaded: true,
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