import { useState, type FormEvent, type Dispatch, type SetStateAction } from "react";
import { getErrorMessage } from "@/lib/errors";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyType } from "@/config/vocabulary";
import type { WordFormErrors } from "@/lib/vocabulary/word-form";
import { validateVocabularyWordForm } from "@/lib/vocabulary/word-form";

export function useWordFormSubmission({
  word,
  meaning,
  type,
  category,
  detailedMeanings,
  editingWord,
  image,
  setErrors,
  onSubmit,
}: {
  word: string;
  meaning: string;
  type: VocabularyType;
  category: VocabularyWord["category"];
  detailedMeanings: NonNullable<VocabularyWord["detailedMeanings"]>;
  editingWord?: VocabularyWord | null;
  image: {
    validateSelectedImage: () => boolean;
    uploadSelectedImage: (wordId: string) => Promise<string | null>;
    removeCurrentImage: boolean;
    removeUploadedImage: (path: string) => Promise<void>;
  };
  setErrors: Dispatch<SetStateAction<WordFormErrors>>;
  onSubmit: (word: VocabularyWord) => Promise<boolean>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
    words: VocabularyWord[],
  ) {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validateVocabularyWordForm({
      word,
      meaning,
      words,
      editingWordId: editingWord?.id,
    });
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (!image.validateSelectedImage()) return;

      const trimmedWord = word.trim();
      const trimmedMeaning = meaning.trim();
      const wordId = editingWord?.id ?? crypto.randomUUID();
      const uploadedPath = await image.uploadSelectedImage(wordId);
      const success = await onSubmit({
        id: wordId,
        word: trimmedWord,
        meaning: trimmedMeaning,
        type,
        category,
        status: editingWord?.status ?? "learning",
        detailedMeanings: detailedMeanings
          .map((item) => ({ ...item, meaning: item.meaning.trim() }))
          .filter((item) => item.meaning.length > 0),
        imagePath:
          uploadedPath ??
          (image.removeCurrentImage ? null : editingWord?.imagePath ?? null),
      });
      if (!success && uploadedPath) await image.removeUploadedImage(uploadedPath);
    } catch (error) {
      setErrors((current) => ({
        ...current,
        image: getErrorMessage(error, "Could not upload image."),
      }));
    } finally {
      setIsSubmitting(false);
    }
  }

  return { isSubmitting, handleSubmit };
}
