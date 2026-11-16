import { type FormEvent, useState } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategory, VocabularyType } from "@/config/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { useWordFormImage } from "@/hooks/useWordFormImage";
import { useVocabularyDetailedMeanings } from "@/hooks/useVocabularyDetailedMeanings";
import { type WordFormErrors } from "@/lib/vocabulary/word-form";
import { useWordFormSubmission } from "@/hooks/useWordFormSubmission";

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
  const image = useWordFormImage(setErrors);
  const submission = useWordFormSubmission({
    word,
    meaning,
    type,
    category,
    detailedMeanings,
    editingWord,
    image,
    setErrors,
    onSubmit,
  });

  function clearError(field: keyof WordFormErrors) {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    await submission.handleSubmit(event, words);
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
    submission: { isSubmitting: submission.isSubmitting, handleSubmit },
  };
}
