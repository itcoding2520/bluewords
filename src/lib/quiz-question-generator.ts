import type { VocabularyMeaning, VocabularyWord } from "@/data/vocabulary";
import { normalizeQuizAnswer } from "@/lib/supabase/normalize-quiz-answer.mjs";
import type { QuizQuestion } from "@/lib/quiz-model";
import { sampleRandom, sampleRandomMatching, shuffle } from "@/lib/quiz-random";

function meaningsFor(word: VocabularyWord): VocabularyMeaning[] {
  const detailed = word.type === "expression" ? [] : word.detailedMeanings?.filter((item) => item.meaning.trim()) ?? [];
  return detailed.length > 0 ? detailed : word.meaning.trim()
    ? [{ partOfSpeech: "noun", meaning: word.meaning.trim() }]
    : [];
}

/** Build randomized multiple-choice questions from vocabulary words. */
export function buildMeaningQuestions(words: VocabularyWord[]): QuizQuestion[] {
  const entries = words.map((word) => ({ word, meanings: meaningsFor(word) }));
  const uniqueAnswers = [...new Map(entries
    .flatMap(({ meanings }) => meanings.map((meaning) => meaning.meaning.trim()))
    .map((meaning) => [meaning.toLocaleLowerCase(), meaning] as const)).values()];
  const uniqueWords = [...new Map(words.map((word) => [normalizeQuizAnswer(word.word), word.word.trim()] as const))]
    .map(([normalized, word]) => ({ normalized, word }));

  return shuffle(entries.flatMap(({ word, meanings: wordMeanings }) => {
    if (wordMeanings.length === 0) return [];
    const meaning = wordMeanings[Math.floor(Math.random() * wordMeanings.length)];
    const normalizedMeaning = meaning.meaning.trim().toLocaleLowerCase();
    const meaningDistractors = shuffle(sampleRandomMatching(
      uniqueAnswers,
      3,
      (answer) => answer.toLocaleLowerCase() !== normalizedMeaning
    ));
    const normalizedWord = normalizeQuizAnswer(word.word);
    const wordDistractors = shuffle(sampleRandomMatching(
      uniqueWords,
      3,
      (answer) => answer.normalized !== normalizedWord
    )).map((answer) => answer.word);
    const canChooseMeaning = meaningDistractors.length === 3;
    const canChooseWord = wordDistractors.length === 3;
    if (!canChooseMeaning && !canChooseWord) return [];
    const choiceType: QuizQuestion["choiceType"] = canChooseMeaning && canChooseWord
      ? Math.random() < 0.5 ? "meaning" : "word"
      : canChooseMeaning ? "meaning" : "word";
    const correctAnswer = choiceType === "meaning" ? meaning.meaning.trim() : word.word.trim();
    const distractors = choiceType === "meaning" ? meaningDistractors : wordDistractors;
    return [{
      word,
      meaning: meaning.meaning.trim(),
      partOfSpeech: word.type !== "expression" && word.detailedMeanings?.some((item) => item.meaning.trim()) ? meaning.partOfSpeech : null,
      choices: sampleRandom([correctAnswer, ...distractors], distractors.length + 1),
      choiceType,
      correctAnswer,
    }];
  }));
}
