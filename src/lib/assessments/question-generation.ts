import { shuffle } from "@/lib/random";
import type { AssessmentQuestion } from "@/lib/assessments/types";
import { normalizeVocabularyText } from "@/lib/vocabulary/normalize-text";

type AssessmentDifficulty = "easy" | "medium" | "hard";
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
  const defaultSet = new Set((defaultKeys ?? []).map((item) => item.normalized_word));
  const wordMap = new Map<string, { word: string; meaning: string; category: string; imagePath: string | null }>();
  for (const row of vocabularyRows ?? []) {
    const normalized = normalizeVocabularyText(row.word);
    if (row.type === "word" && row.meaning.trim() && defaultSet.has(normalized)) {
      wordMap.set(normalized, { word: row.word, meaning: row.meaning, category: row.category, imagePath: row.image_path });
    }
  }
  for (const row of communityWords ?? []) {
    const normalized = normalizeVocabularyText(row.word);
    const category = Array.isArray(row.community_categories)
      ? row.community_categories[0]?.name
      : (row.community_categories as { name?: string } | null)?.name;
    if (row.meaning.trim()) {
      wordMap.set(normalized, { word: row.word, meaning: row.meaning, category: category ?? "Community", imagePath: row.image_path });
    }
  }

  const wordPool = shuffle([...wordMap.values()].filter(({ word }) => difficulty === "easy" ? word.length <= 5 : difficulty === "medium" ? word.length >= 6 && word.length <= 8 : word.length >= 9));
  const sentencePool = shuffle(sentenceQuestions ?? []);
  if (wordPool.length < 5 || sentencePool.length < 5) return null;

  const vocabularyQuestions: AssessmentQuestion[] = wordPool.slice(0, 5).map((word) => {
    const distractors = shuffle(wordPool.filter((candidate) => candidate.word !== word.word && candidate.meaning !== word.meaning)).slice(0, 3).map((candidate) => candidate.meaning);
    const choices = shuffle([word.meaning, ...distractors]);
    return { type: "vocabulary", prompt: `Choose the correct meaning of “${word.word}”.`, word: word.word, meaning: word.meaning, category: word.category, imagePath: word.imagePath, choices, answer: word.meaning };
  });
  const sentenceQuestionItems: AssessmentQuestion[] = sentencePool.slice(0, 5).map((question) => {
    const answerTokens = Array.isArray(question.answer_tokens) ? question.answer_tokens.map(String) : [];
    const distractors = Array.isArray(question.distractor_tokens) ? question.distractor_tokens.map(String) : [];
    return { type: "sentence", prompt: question.prompt_vi, category: question.category, imageKeyword: question.image_keyword, tiles: shuffle([...answerTokens, ...distractors]), answer: question.answer_sentence };
  });

  return shuffle([...vocabularyQuestions, ...sentenceQuestionItems]);
}
