import { type FormEvent, useState } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategory, VocabularyType } from "@/config/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { useWordFormImage } from "@/hooks/useWordFormImage";
import { useVocabularyDetailedMeanings } from "@/hooks/useVocabularyDetailedMeanings";
import { validateVocabularyWordForm, type WordFormErrors } from "@/lib/vocabulary/word-form";

export type { WordFormErrors } from "@/lib/vocabulary/word-form";

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
  const { detailedMeanings, updateDetailedMeaning, addDetailedMeaning, removeDetailedMeaning } =
    useVocabularyDetailedMeanings(editingWord?.detailedMeanings ?? []);
  const [errors, setErrors] = useState<WordFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const image = useWordFormImage(setErrors);

  function clearError(field: keyof WordFormErrors) {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
        image: error instanceof Error ? error.message : "Could not upload image.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    fields: { word, setWord, meaning, setMeaning, type, setType, category, setCategory },
    validation: { errors, clearError },
    image: {
      selected: image.selectedImage,
      removeCurrent: image.removeCurrentImage,
      previewUrl: image.selectedImageUrl,
      select: image.selectImage,
      remove: image.removeImage,
    },
    detailedMeanings: {
      items: detailedMeanings,
      update: updateDetailedMeaning,
      add: addDetailedMeaning,
      remove: removeDetailedMeaning,
    },
    submission: { isSubmitting, handleSubmit },
  };
}
