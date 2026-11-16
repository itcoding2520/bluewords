import type { VocabularyMeaning, VocabularyWord } from "@/data/vocabulary";
import { normalizeQuizAnswer } from "@/lib/supabase/normalize-quiz-answer.mjs";
import type { QuizQuestion } from "@/lib/quiz-model";
import { sampleRandom, sampleRandomMatching, shuffle } from "@/lib/random";

function meaningsFor(word: VocabularyWord): VocabularyMeaning[] {
  const detailed = word.type === "expression" ? [] : word.detailedMeanings?.filter((item) => item.meaning.trim()) ?? [];
  return detailed.length > 0 ? detailed : word.meaning.trim()
    ? [{ partOfSpeech: "noun", meaning: word.meaning.trim() }]
    : [];
}

/** Build randomized multiple-choice questions from vocabulary words. */
export function buildMeaningQuestions(words: VocabularyWord[]): QuizQuestion[] {
  const entries: Array<{ word: VocabularyWord; meanings: VocabularyMeaning[] }> = [];
  const answersByKey = new Map<string, string>();
  const wordsByKey = new Map<string, string>();
  for (const word of words) {
    const meanings = meaningsFor(word);
    entries.push({ word, meanings });
    for (const meaning of meanings) {
      const answer = meaning.meaning.trim();
      answersByKey.set(normalizeQuizAnswer(answer), answer);
    }
    wordsByKey.set(normalizeQuizAnswer(word.word), word.word.trim());
  }
  const uniqueAnswers = [...answersByKey.values()];
  const uniqueWords = [...wordsByKey].map(([normalized, word]) => ({ normalized, word }));

  const questions: QuizQuestion[] = [];
  for (const { word, meanings: wordMeanings } of entries) {
    if (wordMeanings.length === 0) continue;
    const meaning = wordMeanings[Math.floor(Math.random() * wordMeanings.length)];
    const normalizedMeaning = normalizeQuizAnswer(meaning.meaning);
    const meaningDistractors = shuffle(sampleRandomMatching(
      uniqueAnswers,
      3,
      (answer) => normalizeQuizAnswer(answer) !== normalizedMeaning
    ));
    const normalizedWord = normalizeQuizAnswer(word.word);
    const wordDistractors = shuffle(sampleRandomMatching(
      uniqueWords,
      3,
      (answer) => answer.normalized !== normalizedWord
    )).map((answer) => answer.word);
    const canChooseMeaning = meaningDistractors.length === 3;
    const canChooseWord = wordDistractors.length === 3;
    if (!canChooseMeaning && !canChooseWord) continue;
    const choiceType: QuizQuestion["choiceType"] = canChooseMeaning && canChooseWord
      ? Math.random() < 0.5 ? "meaning" : "word"
      : canChooseMeaning ? "meaning" : "word";
    const correctAnswer = choiceType === "meaning" ? meaning.meaning.trim() : word.word.trim();
    const distractors = choiceType === "meaning" ? meaningDistractors : wordDistractors;
    questions.push({
      word,
      meaning: meaning.meaning.trim(),
      partOfSpeech: word.type !== "expression" && word.detailedMeanings?.some((item) => item.meaning.trim()) ? meaning.partOfSpeech : null,
      choices: sampleRandom([correctAnswer, ...distractors], distractors.length + 1),
      choiceType,
      correctAnswer,
    });
  }
  return shuffle(questions);
}
