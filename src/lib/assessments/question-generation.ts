import { shuffle, shuffleAndTake } from "@/lib/random";
import type { AssessmentQuestion } from "@/lib/assessments/types";
import { ASSESSMENT_QUESTION_COUNTS } from "@/lib/assessments/constants";
import { normalizeVocabularyText } from "@/lib/vocabulary/normalize-text";
import type { DifficultyLevel } from "@/types/difficulty";
import { firstRelation } from "@/lib/supabase/first-relation";

type AssessmentDifficulty = DifficultyLevel;
type AssessmentWord = { word: string; meaning: string; category: string; imagePath: string | null };
type DefaultVocabularyKey = { normalized_word: string };
type VocabularySource = { word: string; meaning: string; category: string; image_path: string | null; type: string };
type CommunityCategory = { name: string };
type SharedVocabularySource = {
  word: string;
  meaning: string;
  image_path: string | null;
  community_categories: CommunityCategory | CommunityCategory[] | null;
};
type SentenceQuestionSource = {
  difficulty: string;
  category: string;
  prompt_vi: string;
  answer_sentence: string;
  answer_tokens: unknown;
  distractor_tokens: unknown;
  image_keyword: string;
};

function matchesAssessmentDifficulty(word: string, difficulty: AssessmentDifficulty) {
  if (difficulty === "easy") return word.length <= 5;
  if (difficulty === "medium") return word.length >= 6 && word.length <= 8;
  return word.length >= 9;
}

export function generateAssessmentQuestions({
  defaultKeys,
  vocabularyRows,
  communityWords,
  sentenceQuestions,
  difficulty,
}: {
  defaultKeys: DefaultVocabularyKey[] | null;
  vocabularyRows: VocabularySource[] | null;
  communityWords: SharedVocabularySource[] | null;
  sentenceQuestions: SentenceQuestionSource[] | null;
  difficulty: AssessmentDifficulty;
}): AssessmentQuestion[] | null {
  const defaultSet = new Set<string>();
  for (const item of defaultKeys ?? []) defaultSet.add(item.normalized_word);
  const wordMap = new Map<string, AssessmentWord>();
  for (const row of vocabularyRows ?? []) {
    const normalized = normalizeVocabularyText(row.word);
    if (row.type === "word" && row.meaning.trim() && defaultSet.has(normalized)) {
      wordMap.set(normalized, { word: row.word, meaning: row.meaning, category: row.category, imagePath: row.image_path });
    }
  }
  for (const row of communityWords ?? []) {
    const normalized = normalizeVocabularyText(row.word);
    const category = firstRelation(row.community_categories)?.name;
    if (row.meaning.trim()) {
      wordMap.set(normalized, { word: row.word, meaning: row.meaning, category: category ?? "Community", imagePath: row.image_path });
    }
  }

  const eligibleWords: AssessmentWord[] = [];
  for (const word of wordMap.values()) {
    if (matchesAssessmentDifficulty(word.word, difficulty)) eligibleWords.push(word);
  }
  const wordPool = shuffle(eligibleWords);
  const sentencePool = shuffle(sentenceQuestions ?? []);
  if (wordPool.length < ASSESSMENT_QUESTION_COUNTS.vocabulary
    || sentencePool.length < ASSESSMENT_QUESTION_COUNTS.sentence) return null;

  const vocabularyQuestions: AssessmentQuestion[] = wordPool.slice(0, ASSESSMENT_QUESTION_COUNTS.vocabulary).map((word) => {
    const distractors = shuffleAndTake(
      wordPool.filter((candidate) => candidate.word !== word.word && candidate.meaning !== word.meaning),
      3,
    ).map((candidate) => candidate.meaning);
    const choices = shuffle([word.meaning, ...distractors]);
    return { type: "vocabulary", prompt: `Choose the correct meaning of “${word.word}”.`, word: word.word, meaning: word.meaning, category: word.category, imagePath: word.imagePath, choices, answer: word.meaning };
  });
  const sentenceQuestionItems: AssessmentQuestion[] = sentencePool.slice(0, ASSESSMENT_QUESTION_COUNTS.sentence).map((question) => {
    const answerTokens = Array.isArray(question.answer_tokens) ? question.answer_tokens.map(String) : [];
    const distractors = Array.isArray(question.distractor_tokens) ? question.distractor_tokens.map(String) : [];
    return { type: "sentence", prompt: question.prompt_vi, category: question.category, imageKeyword: question.image_keyword, tiles: shuffle([...answerTokens, ...distractors]), answer: question.answer_sentence };
  });

  return shuffle([...vocabularyQuestions, ...sentenceQuestionItems]);
}
