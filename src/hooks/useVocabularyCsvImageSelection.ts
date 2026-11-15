import { useMemo, useRef, useState, type ChangeEvent } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import { validateVocabularyImage } from "@/lib/supabase/vocabulary-images";
import { matchVocabularyImportImages } from "@/lib/vocabulary-image-matching";
import type { VocabularyCsvPreview } from "@/lib/vocabulary-csv";

export function useVocabularyCsvImageSelection(input: {
  words: VocabularyWord[];
  preview: VocabularyCsvPreview | null;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const importableWords = useMemo(
    () => input.preview?.items.map((item) => item.word) ?? [],
    [input.preview]
  );

  const imageMatch = useMemo(() => matchVocabularyImportImages(
    imageFiles,
    importableWords,
    input.words,
    (file) => validateVocabularyImage(file) === null
  ), [imageFiles, importableWords, input.words]);

  function selectImageFiles(event: ChangeEvent<HTMLInputElement>) {
    const selectedImages = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(file.name)
    );
    setImageFiles(selectedImages);
    event.currentTarget.value = "";
  }

  function clearImageFiles() {
    setImageFiles([]);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  return { imageInputRef, imageFiles, imageMatch, selectImageFiles, clearImageFiles };
}
