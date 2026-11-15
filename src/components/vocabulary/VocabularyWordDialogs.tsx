import dynamic from "next/dynamic";

import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";

// Keep modal code out of the vocabulary browsing bundle until it is needed.
const WordFormModal = dynamic(() => import("@/components/vocabulary/WordFormModal").then((module) => module.WordFormModal));
const DeleteConfirmModal = dynamic(() => import("@/components/vocabulary/DeleteConfirmModal").then((module) => module.DeleteConfirmModal));

export function VocabularyWordDialogs({
  isFormOpen,
  words,
  categories,
  editingWord,
  onCloseForm,
  onSubmitWord,
  deletingWord,
  isDeleting,
  onCloseDelete,
  onConfirmDelete,
}: {
  isFormOpen: boolean;
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  editingWord: VocabularyWord | null;
  onCloseForm: () => void;
  onSubmitWord: (word: VocabularyWord) => Promise<boolean>;
  deletingWord: VocabularyWord | null;
  isDeleting: boolean;
  onCloseDelete: () => void;
  onConfirmDelete: () => void | Promise<void>;
}) {
  return (
    <>
      {isFormOpen && (
        <WordFormModal
          key={editingWord?.id ?? "new"}
          open={isFormOpen}
          words={words}
          categories={categories}
          editingWord={editingWord}
          onClose={onCloseForm}
          onSubmit={onSubmitWord}
        />
      )}

      {deletingWord && (
        <DeleteConfirmModal
          word={deletingWord}
          isDeleting={isDeleting}
          onClose={onCloseDelete}
          onConfirm={onConfirmDelete}
        />
      )}
    </>
  );
}
