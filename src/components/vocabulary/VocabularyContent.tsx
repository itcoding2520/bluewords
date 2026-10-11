"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  type VocabularyWord,
} from "@/data/vocabulary";

import { WordFormModal } from "./WordFormModal";
import { VocabularyHeader } from "./VocabularyHeader";
import { VocabularyList } from "./VocabularyList";
import { VocabularyToolbar } from "./VocabularyToolbar";
import type {
  CategoryFilter,
} from "./VocabularyToolbar";
import { Button } from "../ui/Button";
import { useVocabulary } from "@/contexts/VocabularyContext";

export function VocabularyContent() {
  const {
    words,
    isLoaded,
    addWord,
    updateWord,
    deleteWord,
    toggleMastered,
  } = useVocabulary();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [deletingWord, setDeletingWord] = useState<VocabularyWord | null>(null);

  const filteredWords = useMemo(() => {
    return words.filter((item) => {
      const query = search.toLowerCase();

      const matchesSearch =
        item.word.toLowerCase().includes(query) ||
        item.meaning.toLowerCase().includes(query);

      const matchesCategory =
        category === "All" ||
        item.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [words, search, category]);

  function handleOpenAdd() {
    setEditingWord(null);
    setIsFormOpen(true);
  }

  function handleEditWord(word: VocabularyWord) {
    setEditingWord(word);
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
    setEditingWord(null);
  }

  function handleDeleteWord(word: VocabularyWord) {
    setDeletingWord(word);
  }

  function handleConfirmDelete() {
    if (!deletingWord) return;

    deleteWord(deletingWord.id);
    setDeletingWord(null);
  }

  function handleSubmitWord(submittedWord: VocabularyWord) {
    if (editingWord) {
      updateWord(submittedWord);
    } else {
      addWord(submittedWord);
    }
  }

  if (!isLoaded) {
    return (
      <div className="py-16 text-sm text-slate-500">
        Loading vocabulary...
      </div>
    );
  }

  return (
    <>
      <VocabularyHeader
        onAddWord={handleOpenAdd}
      />

      <VocabularyToolbar
        search={search}
        category={category}
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
      />

      <VocabularyList
        words={filteredWords}
        onToggleMastered={toggleMastered}
        onEdit={handleEditWord}
        onDelete={handleDeleteWord}
      />

      {isFormOpen && (
        <WordFormModal
          key={editingWord?.id ?? "new"}
          open={isFormOpen}
          words={words}
          editingWord={editingWord}
          onClose={handleCloseForm}
          onSubmit={handleSubmitWord}
        />
      )}

      {deletingWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">
              Delete word?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to delete{" "}
              <span className="font-medium text-slate-900">
                &ldquo;{deletingWord.word}&rdquo;
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setDeletingWord(null)}
              >
                Cancel
              </Button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}