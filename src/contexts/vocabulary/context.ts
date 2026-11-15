import { createContext } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import type {
  VocabularyCategoryRow,
  VocabularyCategoryUpdate,
} from "@/lib/supabase/categories";
import type { VocabularyCategoryColor } from "@/config/vocabulary";
import type { VocabularyCsvWord } from "@/lib/vocabulary-csv";

export interface VocabularyContextValue {
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

export const VocabularyContext = createContext<VocabularyContextValue | null>(null);
