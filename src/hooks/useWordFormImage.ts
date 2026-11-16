import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { deleteVocabularyImages, uploadVocabularyImage, validateVocabularyImage } from "@/lib/supabase/vocabulary-images";
import type { WordFormErrors } from "@/lib/vocabulary/word-form";

export function useWordFormImage(setErrors: Dispatch<SetStateAction<WordFormErrors>>) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedImageUrl) return;
    return () => URL.revokeObjectURL(selectedImageUrl);
  }, [selectedImageUrl]);

  function selectImage(file: File | null) {
    setSelectedImage(file);
    setSelectedImageUrl(file ? URL.createObjectURL(file) : null);
    setRemoveCurrentImage(false);
  }

  function removeImage() {
    setSelectedImage(null);
    setSelectedImageUrl(null);
    setRemoveCurrentImage(true);
  }

  function validateSelectedImage() {
    if (!selectedImage) return true;
    const imageError = validateVocabularyImage(selectedImage);
    if (!imageError) return true;
    setErrors((current) => ({ ...current, image: imageError }));
    return false;
  }

  function uploadSelectedImage(wordId: string) {
    return selectedImage ? uploadVocabularyImage(wordId, selectedImage) : Promise.resolve(null);
  }

  async function removeUploadedImage(path: string) {
    await deleteVocabularyImages([path]);
  }

  return {
    selectedImage,
    removeCurrentImage,
    selectedImageUrl,
    selectImage,
    removeImage,
    validateSelectedImage,
    uploadSelectedImage,
    removeUploadedImage,
  };
}
