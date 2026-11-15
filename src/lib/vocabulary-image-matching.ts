import type { VocabularyWord } from "@/data/vocabulary";

function normalizeImageName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]/g, "");
}

export function matchVocabularyImportImages(
  imageFiles: File[],
  importableWords: string[],
  existingWords: VocabularyWord[],
  isValidImage: (file: File) => boolean
) {
  const supported = imageFiles.filter(isValidImage);
  const invalidCount = imageFiles.length - supported.length;
  const filesByName = new Map<string, File>();
  const ambiguousNames = new Set<string>();

  for (const file of supported) {
    const key = normalizeImageName(file.name);
    if (filesByName.has(key)) {
      filesByName.delete(key);
      ambiguousNames.add(key);
    } else if (!ambiguousNames.has(key)) {
      filesByName.set(key, file);
    }
  }

  const imageFilesByWord = new Map<string, File>();
  const importableNames = new Set(importableWords.map(normalizeImageName));
  const currentWordsByName = new Map(existingWords.map((word) => [normalizeImageName(word.word), word]));
  let alreadyHasImage = 0;

  for (const [key, file] of filesByName) {
    if (ambiguousNames.has(key)) continue;
    const existingWord = currentWordsByName.get(key);
    if (existingWord && !existingWord.imagePath) imageFilesByWord.set(key, file);
    else if (existingWord?.imagePath) alreadyHasImage++;
    else if (importableNames.has(key)) imageFilesByWord.set(key, file);
  }

  return {
    imageFilesByWord,
    matched: imageFilesByWord.size,
    unmatched: [...filesByName.keys()].filter((key) =>
      !importableNames.has(key) && !currentWordsByName.has(key)
    ).length + ambiguousNames.size,
    invalidCount,
    alreadyHasImage,
  };
}
