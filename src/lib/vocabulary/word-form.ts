import type { VocabularyWord } from "@/data/vocabulary";

export interface WordFormErrors {
  word?: string;
  meaning?: string;
  image?: string;
}

export function validateVocabularyWordForm(input: {
  word: string;
  meaning: string;
  words: VocabularyWord[];
  editingWordId?: string;
}): WordFormErrors {
  const trimmedWord = input.word.trim();
  const trimmedMeaning = input.meaning.trim();
  const errors: WordFormErrors = {};

  if (!trimmedWord) errors.word = "Word is required.";
  if (!trimmedMeaning) errors.meaning = "Meaning is required.";

  const wordExists = input.words.some(
    (item) =>
      item.word.toLowerCase() === trimmedWord.toLowerCase() &&
      item.id !== input.editingWordId
  );
  if (wordExists) errors.word = "This word already exists.";

  return errors;
}
