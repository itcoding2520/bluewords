import { type FormEvent, useState } from "react";
import type { VocabularyMeaning, VocabularyWord } from "@/data/vocabulary";
import {
  PARTS_OF_SPEECH,
  type VocabularyCategory,
  type VocabularyType,
} from "@/config/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { useWordFormImage } from "@/hooks/useWordFormImage";

export interface WordFormErrors {
  word?: string;
  meaning?: string;
  image?: string;
}

interface UseWordFormControllerOptions {
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  editingWord?: VocabularyWord | null;
  onSubmit: (word: VocabularyWord) => Promise<boolean>;
}

export function useWordFormController({
  words,
  categories,
  editingWord,
  onSubmit,
}: UseWordFormControllerOptions) {
  const [word, setWord] = useState(editingWord?.word ?? "");
  const [meaning, setMeaning] = useState(editingWord?.meaning ?? "");
  const [type, setType] = useState<VocabularyType>(editingWord?.type ?? "word");
  const [category, setCategory] = useState<VocabularyCategory>(
    editingWord?.category ??
      categories.find((item) => item.name === "Daily")?.name ??
      categories[0]?.name ??
      "Uncategorized"
  );
  const [detailedMeanings, setDetailedMeanings] = useState<VocabularyMeaning[]>(
    editingWord?.detailedMeanings ?? []
  );
  const [errors, setErrors] = useState<WordFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const image = useWordFormImage(setErrors);

  function clearError(field: keyof WordFormErrors) {
    setErrors((current) => ({ ...current, [field]: undefined }));
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
      { partOfSpeech: PARTS_OF_SPEECH[0], meaning: "" },
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
    const nextErrors: WordFormErrors = {};

    if (!trimmedWord) nextErrors.word = "Word is required.";
    if (!trimmedMeaning) nextErrors.meaning = "Meaning is required.";

    const wordExists = words.some(
      (item) =>
        item.word.toLowerCase() === trimmedWord.toLowerCase() &&
        item.id !== editingWord?.id
    );
    if (wordExists) nextErrors.word = "This word already exists.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (!image.validateSelectedImage()) return;

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
        image: error instanceof Error ? error.message : "Could not upload image.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
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
    setErrors,
    isSubmitting,
    selectedImage: image.selectedImage,
    removeCurrentImage: image.removeCurrentImage,
    selectedImageUrl: image.selectedImageUrl,
    selectImage: image.selectImage,
    removeImage: image.removeImage,
    clearError,
    updateDetailedMeaning,
    addDetailedMeaning,
    removeDetailedMeaning,
    handleSubmit,
  };
}
