import type { VocabularyWord } from "@/data/vocabulary";
import { shuffle } from "@/lib/quiz-random";
import { getPrimaryVocabularyMeaning } from "@/lib/vocabulary/meaning";

export type ScrambleWord = {
  id: string;
  word: string;
  answer: string;
  meaning: string;
  category: string;
  imagePath: string | null;
  imageUrl: string | null;
};

export type LetterTile = { id: number; letter: string };

export function buildWordScrambleCandidates(
  words: VocabularyWord[],
  category: string
): ScrambleWord[] {
  const seen = new Set<string>();
  return words.flatMap((word) => {
    const answer = word.word.trim().toLocaleLowerCase().replace(/[^a-z]/g, "");
    const meaning = getPrimaryVocabularyMeaning(word);
    if ((category !== "all" && word.category !== category)
      || answer.length < 3 || answer.length > 10 || !meaning || seen.has(answer)) return [];
    seen.add(answer);
    return [{
      id: word.id,
      word: word.word.trim(),
      answer,
      meaning,
      category: word.category,
      imagePath: word.imagePath ?? null,
      imageUrl: word.imageUrl ?? null,
    }];
  });
}

export function createScrambledTiles(answer: string): LetterTile[] {
  const letters = [...answer].map((letter, id) => ({ id, letter }));
  let shuffled = shuffle(letters);
  let attempts = 0;
  while (shuffled.map(({ letter }) => letter).join("") === answer && attempts < 8) {
    shuffled = shuffle(letters);
    attempts += 1;
  }
  if (shuffled.map(({ letter }) => letter).join("") === answer && shuffled.length > 1) {
    const swapIndex = shuffled.findIndex((tile, index) => tile.letter !== shuffled[0].letter && index > 0);
    if (swapIndex > 0) [shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[0]];
  }
  return shuffled;
}
