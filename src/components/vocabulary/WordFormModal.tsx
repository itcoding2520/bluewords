"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { VocabularyWord } from "@/data/vocabulary";
import {
  VOCABULARY_TYPES,
  type VocabularyCategory,
  type VocabularyType,
} from "@/config/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { Select } from "../ui/Select";
import * as Dialog from "@radix-ui/react-dialog";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { VocabularyImageField } from "@/components/vocabulary/VocabularyImageField";
import { useWordFormController } from "@/hooks/useWordFormController";
import { DetailedMeaningsEditor } from "@/components/vocabulary/DetailedMeaningsEditor";
import { VocabularyWordCategoryField } from "@/components/vocabulary/VocabularyWordCategoryField";
import { VocabularyWordTextFields } from "@/components/vocabulary/VocabularyWordTextFields";

interface WordFormModalProps {
  open: boolean;
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  editingWord?: VocabularyWord | null;
  onClose: () => void;
  onSubmit: (word: VocabularyWord) => Promise<boolean>;
}

export function WordFormModal({
  open,
  words,
  categories,
  editingWord,
  onClose,
  onSubmit,
}: WordFormModalProps) {
  const {
    word,
    setWord,
    meaning,
    setMeaning,
    type,
    setType,
    category,
    setCategory,
    detailedMeanings,
    errors,
    clearError,
    isSubmitting,
    selectedImage,
    setSelectedImage,
    removeCurrentImage,
    setRemoveCurrentImage,
    selectedImageUrl,
    updateDetailedMeaning,
    addDetailedMeaning,
    removeDetailedMeaning,
    handleSubmit,
  } = useWordFormController({ words, categories, editingWord, onSubmit });
  const existingImageUrl = useVocabularyImageUrl(
    removeCurrentImage ? null : editingWord?.imagePath
  );
  const isEditing = Boolean(editingWord);
  const titleRef = useRef<HTMLHeadingElement>(null);

  if (!open) {
    return null;
  }

  function handleClose() {
    if (isSubmitting) return;
    onClose();
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm" />

        <Dialog.Content
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            titleRef.current?.focus();
          }}
          aria-describedby="word-modal-description"
          className="hide-scrollbar fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-24px)] w-[calc(100%-24px)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-2xl bg-white p-4 shadow-xl sm:max-h-[calc(100dvh-48px)] sm:w-[calc(100%-48px)] sm:rounded-3xl sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Dialog.Title
                ref={titleRef}
                tabIndex={-1}
                className="text-lg font-semibold text-slate-950 outline-none sm:text-xl"
              >
                {isEditing ? "Edit word" : "Add new word"}
              </Dialog.Title>

              <Dialog.Description
                id="word-modal-description"
                className="mt-1 text-sm text-slate-500"
              >
                {isEditing
                  ? "Update the details of this word."
                  : "Add a word you want to remember."}
              </Dialog.Description>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="flex size-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-5 space-y-4 sm:mt-6 sm:space-y-5"
          >
            <VocabularyWordTextFields
              word={word}
              setWord={setWord}
              meaning={meaning}
              setMeaning={setMeaning}
              errors={errors}
              clearError={clearError}
            />

            <VocabularyImageField
              previewUrl={selectedImageUrl ?? existingImageUrl}
              hasSelectedImage={Boolean(selectedImage)}
              hasExistingImage={Boolean(editingWord?.imagePath)}
              error={errors.image}
              disabled={isSubmitting}
              onSelect={(file) => {
                setSelectedImage(file);
                setRemoveCurrentImage(false);
                clearError("image");
              }}
              onRemove={() => {
                setSelectedImage(null);
                setRemoveCurrentImage(true);
              }}
            />

            <DetailedMeaningsEditor
              meanings={detailedMeanings}
              onUpdate={updateDetailedMeaning}
              onAdd={addDetailedMeaning}
              onRemove={removeDetailedMeaning}
            />

            <div>
              <label
                htmlFor="type"
                className="text-sm font-medium text-slate-700"
              >
                Type
              </label>

              <Select
                id="type"
                value={type}
                onChange={(event) =>
                  setType(event.target.value as VocabularyType)
                }
                containerClassName="mt-2"
              >
                {VOCABULARY_TYPES.map((vocabularyType) => (
                  <option key={vocabularyType} value={vocabularyType}>
                    {vocabularyType === "word" ? "Word" : "Expression"}
                  </option>
                ))}
              </Select>
            </div>

            <VocabularyWordCategoryField
              category={category}
              categories={categories}
              words={words}
              onChange={(value) => setCategory(value as VocabularyCategory)}
            />

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                    ? "Save changes"
                    : "Add word"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
