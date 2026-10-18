"use client";

import { FormEvent, useRef, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type {
  VocabularyMeaning,
  VocabularyWord,
} from "@/data/vocabulary";
import {
  VOCABULARY_TYPES,
  PARTS_OF_SPEECH,
  type VocabularyCategory,
  type PartOfSpeech,
  type VocabularyType,
} from "@/config/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { Input } from "../ui/Input";
import { cn } from "@/lib/cn";
import { Select } from "../ui/Select";
import * as Dialog from "@radix-ui/react-dialog";

interface WordFormModalProps {
  open: boolean;
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
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
  categories,
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
    editingWord?.category ??
      categories.find((item) => item.name === "Daily")?.name ??
      categories[0]?.name ??
      "Uncategorized"
  );
  const [detailedMeanings, setDetailedMeanings] =
    useState<VocabularyMeaning[]>(
      editingWord?.detailedMeanings ?? []
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

  function updateDetailedMeaning(
    index: number,
    updates: Partial<VocabularyMeaning>
  ) {
    setDetailedMeanings((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...updates } : item
      )
    );
  }

  function addDetailedMeaning() {
    setDetailedMeanings((current) => [
      ...current,
      {
        partOfSpeech: PARTS_OF_SPEECH[0],
        meaning: "",
      },
    ]);
  }

  function removeDetailedMeaning(index: number) {
    setDetailedMeanings((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
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
        detailedMeanings: detailedMeanings
          .map((item) => ({
            ...item,
            meaning: item.meaning.trim(),
          }))
          .filter((item) => item.meaning.length > 0),
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

            <section aria-labelledby="detailed-meanings-heading">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3
                    id="detailed-meanings-heading"
                    className="text-sm font-medium text-slate-700"
                  >
                    Detailed meanings
                    <span className="ml-1 font-normal text-slate-400">
                      (optional)
                    </span>
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Add meanings by part of speech.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addDetailedMeaning}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                >
                  <Plus size={16} />
                  Add meaning
                </button>
              </div>

              {detailedMeanings.length > 0 && (
                <div className="mt-3 space-y-3">
                  {detailedMeanings.map((item, index) => (
                    <div
                      key={item.id ?? `new-meaning-${index}`}
                      className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto]"
                    >
                      <div>
                        <label
                          htmlFor={`meaning-part-${index}`}
                          className="text-xs font-medium text-slate-600"
                        >
                          Part of speech
                        </label>
                        <Select
                          id={`meaning-part-${index}`}
                          value={item.partOfSpeech}
                          onChange={(event) =>
                            updateDetailedMeaning(index, {
                              partOfSpeech: event.target
                                .value as PartOfSpeech,
                            })
                          }
                          className="mt-1.5"
                        >
                          {PARTS_OF_SPEECH.map((partOfSpeech) => (
                            <option
                              key={partOfSpeech}
                              value={partOfSpeech}
                            >
                              {partOfSpeech.replace(/\b\w/g, (letter) =>
                                letter.toUpperCase()
                              )}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div>
                        <label
                          htmlFor={`meaning-detail-${index}`}
                          className="text-xs font-medium text-slate-600"
                        >
                          Detailed meaning
                        </label>
                        <Input
                          id={`meaning-detail-${index}`}
                          value={item.meaning}
                          onChange={(event) =>
                            updateDetailedMeaning(index, {
                              meaning: event.target.value,
                            })
                          }
                          placeholder="Enter this meaning"
                          className="mt-1.5"
                        />
                      </div>

                      <div className="flex items-end justify-end">
                        <button
                          type="button"
                          onClick={() => removeDetailedMeaning(index)}
                          aria-label={`Remove detailed meaning ${index + 1}`}
                          className="flex size-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

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
                {categories.map((categoryOption) => (
                  <option key={categoryOption.id} value={categoryOption.name}>
                    {categoryOption.name}
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
