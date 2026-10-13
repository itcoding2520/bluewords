
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
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
  refreshWords: () => Promise<void>;
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
  const [isLoaded, setIsLoaded] = useState(false);
  
  const requestIdRef = useRef(0);
  const ownerIdRef = useRef<string | null>(null);
  const mountedRef = useRef(false);

  async function refreshWords(): Promise<void> {
    const currentRequest = ++requestIdRef.current;

    setIsLoaded(false);

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
        return;
      }

      // Không giữ dữ liệu của tài khoản trước.
      if (ownerIdRef.current !== user.id) {
        ownerIdRef.current = user.id;
        setWords([]);
      }

      const rows = await getVocabularyWords();

      if (
        !mountedRef.current ||
        currentRequest !== requestIdRef.current
      ) {
        return;
      }

      // Xác minh tài khoản vẫn là người đã bắt đầu request.
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
        setWords([]);
        return;
      }

      setWords(
        rows.map(({ id, word, meaning, category, status }) => ({
          id,
          word,
          meaning,
          category,
          status,
        }))
      );
    } catch (error) {
      if (
        !mountedRef.current ||
        currentRequest !== requestIdRef.current
      ) {
        return;
      }

      console.error("Failed to refresh vocabulary:", error);
      toast.error("Failed to load vocabulary.");
    } finally {
      if (
        mountedRef.current &&
        currentRequest === requestIdRef.current
      ) {
        setIsLoaded(true);
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true;

    void refreshWords();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "USER_UPDATED"
      ) {
        // Hủy hiệu lực request cũ ngay khi Auth thay đổi.
        requestIdRef.current++;
        ownerIdRef.current = null;
        setWords([]);
        setIsLoaded(false);

        // Không gọi Supabase API trực tiếp trong Auth callback.
        setTimeout(() => {
          if (mountedRef.current) {
            void refreshWords();
          }
        }, 0);
      }
    });

    return () => {
      mountedRef.current = false;
      requestIdRef.current++;
      subscription.unsubscribe();
    };
    // Chỉ đăng ký Auth listener một lần cho Supabase client.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

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
