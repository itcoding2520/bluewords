import dynamic from "next/dynamic";

import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { CategoryFilter, VocabularyStatusFilter } from "@/lib/vocabulary/filters";
import { VocabularyToolbar } from "@/components/vocabulary/VocabularyToolbar";

const VocabularyCsvTools = dynamic(() => import("./VocabularyCsvTools").then((module) => module.VocabularyCsvTools));

interface VocabularyBrowserToolbarProps {
  isAdmin: boolean;
  exportCount: number;
  isExportCountLoading: boolean;
  loadExportWords: () => Promise<VocabularyWord[]>;
  exportCategory: CategoryFilter;
  categories: VocabularyCategoryRow[];
  words: VocabularyWord[];
  search: string;
  status: VocabularyStatusFilter;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: CategoryFilter) => void;
  onStatusChange: (value: VocabularyStatusFilter) => void;
  onImportComplete: () => void;
}

export function VocabularyBrowserToolbar({
  isAdmin,
  exportCount,
  isExportCountLoading,
  loadExportWords,
  exportCategory,
  categories,
  words,
  search,
  status,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onImportComplete,
}: VocabularyBrowserToolbarProps) {
  return (
    <div className="vocabulary-toolbar-row flex flex-wrap items-center justify-between gap-3">
      {isAdmin && (
        <VocabularyCsvTools
          exportCount={exportCount}
          isExportCountLoading={isExportCountLoading}
          loadExportWords={loadExportWords}
          exportCategory={exportCategory}
          categories={categories}
          onImportComplete={onImportComplete}
        />
      )}
      <VocabularyToolbar
        search={search}
        category={exportCategory}
        status={status}
        categories={categories}
        words={words}
        onSearchChange={onSearchChange}
        onCategoryChange={onCategoryChange}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}
