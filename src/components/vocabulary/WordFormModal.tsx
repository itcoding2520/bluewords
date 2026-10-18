"use client";

import { FormEvent, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { VocabularyWord } from "@/data/vocabulary";
import {
  VOCABULARY_CATEGORIES,
  VOCABULARY_TYPES,
  type VocabularyCategory,
  type VocabularyType,
} from "@/config/vocabulary";
import { Input } from "../ui/Input";
import { cn } from "@/lib/cn";
import { Select } from "../ui/Select";
import * as Dialog from "@radix-ui/react-dialog";

interface WordFormModalProps {
  open: boolean;
  words: VocabularyWord[];
  editingWord?: VocabularyWord | null;
  onClose: () => void;
  onSubmit: (word: VocabularyWord) => Promise<void>;
}

interface FormErrors {
  word?: string;
  meaning?: string;
}

export function WordFormModal({
  open,
  words,
  editingWord,
  onClose,
  onSubmit,
}: WordFormModalProps) {
  const [word, setWord] = useState(editingWord?.word ?? "");
  const [meaning, setMeaning] = useState(editingWord?.meaning ?? "");
  const [type, setType] = useState<VocabularyType>(
    editingWord?.type ?? "word"
  );
  const [category, setCategory] = useState<VocabularyCategory>(
    editingWord?.category ?? "Daily"
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(editingWord);
  const titleRef = useRef<HTMLHeadingElement>(null);

  if (!open) {
    return null;
  }

  function handleClose() {
    if (isSubmitting) return;
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const trimmedWord = word.trim();
    const trimmedMeaning = meaning.trim();

    const nextErrors: FormErrors = {};

    if (!trimmedWord) {
      nextErrors.word = "Word is required.";
    }

    if (!trimmedMeaning) {
      nextErrors.meaning = "Meaning is required.";
    }

    const wordExists = words.some(
      (item) =>
        item.word.toLowerCase() === trimmedWord.toLowerCase() &&
        item.id !== editingWord?.id
    );

    if (wordExists) {
      nextErrors.word = "This word already exists.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        id: editingWord?.id ?? crypto.randomUUID(),
        word: trimmedWord,
        meaning: trimmedMeaning,
        type,
        category,
        status: editingWord?.status ?? "learning",
        detailedMeanings: editingWord?.detailedMeanings ?? [],
        imagePath: editingWord?.imagePath ?? null,
      });
    } finally {
      setIsSubmitting(false);
    }
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
          className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-24px)] w-[calc(100%-24px)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-2xl bg-white p-4 shadow-xl sm:max-h-[calc(100dvh-48px)] sm:w-[calc(100%-48px)] sm:rounded-3xl sm:p-6"
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
            <div>
              <label
                htmlFor="word"
                className="text-sm font-medium text-slate-700"
              >
                Word or expression
              </label>

              <Input
                id="word"
                value={word}
                onChange={(event) => {
                  setWord(event.target.value);

                  if (errors.word) {
                    setErrors((current) => ({
                      ...current,
                      word: undefined,
                    }));
                  }
                }}
                placeholder="e.g. resilient"
                error={Boolean(errors.word)}
                className="mt-2"
              />

              {errors.word && (
                <p className="mt-1.5 text-xs font-medium text-red-500">
                  {errors.word}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="meaning"
                className="text-sm font-medium text-slate-700"
              >
                Meaning
              </label>

              <textarea
                id="meaning"
                aria-invalid={Boolean(errors.meaning)}
                aria-describedby={
                  errors.meaning ? "meaning-error" : undefined
                }
                value={meaning}
                onChange={(event) => {
                  setMeaning(event.target.value);

                  if (errors.meaning) {
                    setErrors((current) => ({
                      ...current,
                      meaning: undefined,
                    }));
                  }
                }}
                placeholder="What does this word mean?"
                rows={3}
                className={cn(
                  "mt-2 w-full resize-none rounded-xl border px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 sm:text-sm",
                  errors.meaning
                    ? "border-red-300 focus:border-red-400 focus:ring-red-50"
                    : "border-slate-200 focus:border-blue-400 focus:ring-blue-50"
                )}
              />

              {errors.meaning && (
                <p
                  id="meaning-error"
                  className="mt-1.5 text-xs font-medium text-red-500"
                >
                  {errors.meaning}
                </p>
              )}
            </div>

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
                className="mt-2"
              >
                {VOCABULARY_TYPES.map((vocabularyType) => (
                  <option key={vocabularyType} value={vocabularyType}>
                    {vocabularyType === "word" ? "Word" : "Expression"}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label
                htmlFor="category"
                className="text-sm font-medium text-slate-700"
              >
                Category
              </label>

              <Select
                id="category"
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value as VocabularyCategory
                  )
                }
                className="mt-2"
              >
                {VOCABULARY_CATEGORIES.map((categoryOption) => (
                  <option key={categoryOption} value={categoryOption}>
                    {categoryOption}
                  </option>
                ))}
              </Select>
            </div>

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