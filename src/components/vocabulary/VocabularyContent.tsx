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
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import type {
  CategoryFilter,
} from "./VocabularyToolbar";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  
  async function handleConfirmDelete() {
    if (!deletingWord || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const success = await deleteWord(deletingWord.id);

      if (success) {
        setDeletingWord(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitWord(
    submittedWord: VocabularyWord
  ) {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const success = editingWord
        ? await updateWord(submittedWord)
        : await addWord(submittedWord);

      if (success) {
        handleCloseForm();
      }
    } finally {
      setIsSubmitting(false);
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

      <DeleteConfirmModal
        word={deletingWord}
        isDeleting={isSubmitting}
        onClose={() => setDeletingWord(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}