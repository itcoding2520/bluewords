"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { VocabularyWord } from "@/data/vocabulary";
import {
  VOCABULARY_CATEGORIES,
  type VocabularyCategory,
} from "@/config/vocabulary";
import { Input } from "../ui/Input";
import { cn } from "@/lib/cn";
import { Select } from "../ui/Select";

interface WordFormModalProps {
  open: boolean;
  words: VocabularyWord[];
  editingWord?: VocabularyWord | null;
  onClose: () => void;
  onSubmit: (word: VocabularyWord) => void;
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
  const [meaning, setMeaning] = useState(
    editingWord?.meaning ?? ""
  );
  const [category, setCategory] =
    useState<VocabularyCategory>(
      editingWord?.category ?? "Daily"
    );
  const [errors, setErrors] = useState<FormErrors>({});
  const isEditing = Boolean(editingWord);

  if (!open) {
    return null;
  }

  function handleClose() {
    onClose();
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

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
        item.word.toLowerCase() ===
          trimmedWord.toLowerCase() &&
        item.id !== editingWord?.id
    );

    if (wordExists) {
      nextErrors.word = "This word already exists.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      id: editingWord?.id ?? crypto.randomUUID(),
      word: trimmedWord,
      meaning: trimmedMeaning,
      category,
      status: editingWord?.status ?? "learning",
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/30 p-3 backdrop-blur-sm sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="word-modal-title"
        className="my-auto w-full max-w-lg max-h-[calc(100dvh-24px)] overflow-y-auto overscroll-contain rounded-2xl bg-white p-4 shadow-xl sm:max-h-[calc(100dvh-48px)] sm:rounded-3xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="word-modal-title"
              className="text-lg font-semibold text-slate-950 sm:text-xl"
            >
              {isEditing ? "Edit word" : "Add new word"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isEditing
                ? "Update the details of this word."
                : "Add a word you want to remember."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="cursor-pointer flex size-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={18} />
          </button>
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
                Word
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
                autoFocus
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
              aria-describedby={errors.meaning ? "meaning-error" : undefined}
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
                "mt-2 w-full resize-none rounded-xl border px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4",
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
                {VOCABULARY_CATEGORIES.map((category) => (
                    <option
                    key={category}
                    value={category}
                    >
                    {category}
                    </option>
                ))}
            </Select>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
            >
              Cancel
            </Button>

            <Button type="submit">
              {isEditing ? "Save changes" : "Add word"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}