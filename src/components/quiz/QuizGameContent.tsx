"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock3, Gamepad2, History, LoaderCircle, Play, RotateCcw, Sparkles, Star, Trophy, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { PronunciationButton } from "@/components/vocabulary/PronunciationButton";
import type { VocabularyMeaning, VocabularyWord } from "@/data/vocabulary";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { getCategoryImageUrl } from "@/lib/supabase/category-images";
import type { VocabularyCategoryColor } from "@/lib/supabase/categories";
import { filterQuizWordsByCategory } from "@/lib/quiz-category-filter.mjs";
import { getCachedVocabularyQuizAnswers, getCachedVocabularyQuizHistory, getVocabularyQuizAnswers, getVocabularyQuizHistory, saveVocabularyQuizSession } from "@/lib/supabase/quiz";
import { normalizeQuizAnswer } from "@/lib/supabase/normalize-quiz-answer.mjs";
import type { VocabularyQuizAnswerRow, VocabularyQuizSessionRow } from "@/types/database";

type QuizMode = "type-word" | "choose-meaning";
type Phase = "setup" | "playing" | "results";
type Tab = "play" | "history";

interface QuizQuestion {
  word: VocabularyWord;
  meaning: string;
  partOfSpeech: string | null;
  choices: string[];
  choiceType: "meaning" | "word";
  correctAnswer: string;
}

interface QuizAnswer {
  value: string;
  correct: boolean;
}

const QUESTION_COUNTS = [10, 20, 30] as const;
const CATEGORY_DOT_STYLES: Record<VocabularyCategoryColor, string> = {
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  orange: "bg-orange-500",
  green: "bg-emerald-500",
  rose: "bg-rose-500",
  indigo: "bg-indigo-500",
  teal: "bg-teal-500",
  amber: "bg-amber-500",
  pink: "bg-pink-500",
  slate: "bg-slate-500",
};

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

function meaningsFor(word: VocabularyWord): VocabularyMeaning[] {
  const detailed = word.type === "expression" ? [] : word.detailedMeanings?.filter((item) => item.meaning.trim()) ?? [];
  return detailed.length > 0 ? detailed : word.meaning.trim() ? [{ partOfSpeech: "noun", meaning: word.meaning.trim() }] : [];
}

function buildMeaningQuestions(words: VocabularyWord[]): QuizQuestion[] {
  const answerPool = words.flatMap((word) => meaningsFor(word).map((meaning) => ({ meaning: meaning.meaning.trim() })));
  const uniqueAnswers = [...new Map(answerPool.map((answer) => [answer.meaning.toLocaleLowerCase(), answer])).values()];
  const uniqueWords = [...new Map(words.map((word) => [normalizeQuizAnswer(word.word), word.word.trim()] as const)).values()];

  return shuffle(words.flatMap((word) => {
    const wordMeanings = meaningsFor(word);
    if (wordMeanings.length === 0) return [];
    const meaning = shuffle(wordMeanings)[0];
    const meaningDistractors = shuffle(uniqueAnswers
      .filter((answer) => answer.meaning.toLocaleLowerCase() !== meaning.meaning.trim().toLocaleLowerCase())
      .map((answer) => answer.meaning)).slice(0, 3);
    const normalizedWord = normalizeQuizAnswer(word.word);
    const wordDistractors = shuffle(uniqueWords.filter((answer) => normalizeQuizAnswer(answer) !== normalizedWord)).slice(0, 3);
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
      choices: shuffle([correctAnswer, ...distractors]),
      choiceType,
      correctAnswer,
    }];
  }));
}

function expectedAnswer(question: QuizQuestion, mode: QuizMode) {
  if (mode === "type-word" || question.choiceType === "word") return question.word.word;
  // `correctAnswer` was added after quiz questions could already be in React state.
  // Keep active sessions created by Fast Refresh (or older question objects) answerable.
  return typeof question.correctAnswer === "string" ? question.correctAnswer : question.meaning;
}

function promptText(question: QuizQuestion, mode: QuizMode) {
  if (mode === "type-word") return "Image → Type the word";
  if (question.choiceType === "word") return "Meaning → Choose the word";
  return question.word.imagePath ? "Image → Choose the meaning" : "Word → Choose the meaning";
}

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours ? `${hours}:` : ""}${String(minutes).padStart(hours ? 2 : 1, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function QuizImage({ word, className = "" }: { word: VocabularyWord; className?: string }) {
  const imageUrl = useVocabularyImageUrl(word.imagePath);
  if (!imageUrl) return <div className={`grid size-48 place-items-center rounded-2xl bg-slate-100 text-center text-sm text-slate-400 ${className}`}>{word.imagePath ? "Loading image…" : "No image"}</div>;
  return <Image src={imageUrl} alt="Vocabulary quiz prompt" width={200} height={200} unoptimized className={`size-30 rounded-2xl border border-slate-100 object-cover ${className}`} />;
}

function QuizCategoryChip({
  name,
  imagePath,
  dotClassName,
  selected,
  onClick,
}: {
  name: string;
  imagePath: string | null;
  dotClassName: string;
  selected: boolean;
  onClick: () => void;
}) {
  const isCategoryImage = imagePath?.startsWith("category:") ?? false;
  const wordImageUrl = useVocabularyImageUrl(isCategoryImage ? null : imagePath);
  const imageUrl = isCategoryImage ? getCategoryImageUrl(imagePath?.slice("category:".length)) : wordImageUrl;

  return (
    <button type="button" aria-pressed={selected} onClick={onClick} title={name} className={`quiz-category-chip flex h-10 min-w-0 items-center gap-1.5 rounded-full border px-2 text-left text-xs transition sm:gap-2 sm:px-2.5 ${selected ? "border-indigo-200 bg-indigo-50 font-semibold text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50"}`}>
      {imageUrl ? <Image src={imageUrl} alt="" width={24} height={24} unoptimized className="size-6 shrink-0 rounded-full object-cover" /> : <span className={`size-2 shrink-0 rounded-full ${dotClassName}`} aria-hidden="true" />}
      <span className="min-w-0 truncate">{name}</span>
    </button>
  );
}

function QuizPreview({
  mode,
  category,
  questionCount,
  meaningQuestion,
  typeWord,
}: {
  mode: QuizMode;
  category: string;
  questionCount: number;
  meaningQuestion?: QuizQuestion;
  typeWord?: VocabularyWord;
}) {
  const settings = [
    mode === "choose-meaning" ? "Choose meaning" : "Type the word",
    category === "all" ? "All categories" : category,
    `${questionCount} questions`,
  ];

  return (
    <Card className="quiz-preview-card border-indigo-100 bg-indigo-50/70 p-5 sm:p-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-500">Your quiz preview</p>
      <h2 className="quiz-preview-title mt-3 flex items-center gap-2 text-xl font-bold text-slate-900"><span>{mode === "choose-meaning" ? "Choose the meaning" : "Type the word"}</span><Star aria-hidden="true" size={20} className="fill-amber-400 text-amber-400" /></h2>
      <p className="mt-1 text-sm text-slate-500">This is how a question will look.</p>

      <div className="mt-5 rounded-2xl border border-indigo-100 bg-white p-4">
        {mode === "choose-meaning" ? meaningQuestion ? (
          <>
            {meaningQuestion.choiceType === "word"
              ? <p className="py-5 text-center text-2xl font-bold text-slate-900">{meaningQuestion.meaning}</p>
              : meaningQuestion.word.imagePath ? <QuizImage word={meaningQuestion.word} className="quiz-preview-image mx-auto" /> : <p className="py-5 text-center text-2xl font-bold text-slate-900">{meaningQuestion.word.word}</p>}
            {meaningQuestion.partOfSpeech && <span className="mt-3 inline-block rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-medium capitalize text-blue-700">{meaningQuestion.partOfSpeech}</span>}
            <p className="mt-3 text-xs text-slate-500">{meaningQuestion.choiceType === "word" ? "Choose the matching word" : "Choose the correct meaning"}</p>
            <div className="mt-3 grid gap-2">
              {meaningQuestion.choices.map((choice, index) => <div key={`${choice}-${index}`} className={`rounded-lg border px-3 py-2 text-xs ${choice === expectedAnswer(meaningQuestion, mode) ? "border-emerald-200 bg-emerald-50 font-medium text-emerald-800" : "border-slate-200 bg-white text-slate-600"}`}><span className="mr-2 text-[10px] font-semibold text-slate-400">{String.fromCharCode(65 + index)}.</span>{choice}</div>)}
            </div>
          </>
        ) : <p className="py-8 text-center text-sm text-slate-500">Add more vocabulary with meanings to preview this question type.</p> : typeWord ? (
          <>
            <QuizImage word={typeWord} className="quiz-preview-image mx-auto" />
            <p className="mt-4 text-center text-xs text-slate-500">What is this word?</p>
            <div className="mt-3 rounded-xl border border-slate-200 px-3 py-2.5 text-center text-xs text-slate-400">Type the word…</div>
          </>
        ) : <p className="py-8 text-center text-sm text-slate-500">Add images to vocabulary words to preview this question type.</p>}
      </div>

      <div className="mt-5 border-t border-indigo-200/70 pt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-500">Quiz settings</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {settings.map((setting) => <span key={setting} className="rounded-full border border-indigo-100 bg-white px-3 py-2 text-xs font-semibold text-slate-700">{setting}</span>)}
        </div>
        <p className="mt-5 text-xs text-slate-500">Questions are chosen from your vocabulary.</p>
      </div>
    </Card>
  );
}

export function QuizGameContent({ userId }: { userId: string | null }) {
  const { words, categories, isLoaded } = useVocabulary();
  const [mode, setMode] = useState<QuizMode>("choose-meaning");
  const [category, setCategory] = useState("all");
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [phase, setPhase] = useState<Phase>("setup");
  const [tab, setTab] = useState<Tab>("play");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, QuizAnswer>>({});
  const [input, setInput] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [history, setHistory] = useState<VocabularyQuizSessionRow[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [selectedHistory, setSelectedHistory] = useState<VocabularyQuizSessionRow | null>(null);
  const [historyAnswers, setHistoryAnswers] = useState<VocabularyQuizAnswerRow[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const saveStartedRef = useRef<number | null>(null);

  const categoryWords = useMemo(
    () => filterQuizWordsByCategory(words, category),
    [category, words]
  );
  const categoryOptions = useMemo(() => {
    const visibleCategories = categories.filter((item) => item.name.trim().toLowerCase() !== "uncategorized");
    return [
      { id: "all-categories", name: "All categories", value: "all", color: "blue" as VocabularyCategoryColor, imagePath: words.find((word) => word.imagePath)?.imagePath ?? null },
      ...visibleCategories.map((item) => ({
        id: item.id,
        name: item.name,
        value: item.name,
        color: item.color,
        imagePath: item.image_path ? `category:${item.image_path}` : words.find((word) => word.category === item.name && word.imagePath)?.imagePath ?? null,
      })),
    ];
  }, [categories, words]);
  const meaningQuestions = useMemo(() => buildMeaningQuestions(categoryWords), [categoryWords]);
  const previewMeaningQuestion = useMemo(() => {
    const previewBase = meaningQuestions.find((question) => question.word.word.toLocaleLowerCase() === "doctor" && question.word.imagePath)
      ?? meaningQuestions.find((question) => question.choiceType === "meaning" && question.word.imagePath)
      ?? meaningQuestions[0];
    if (!previewBase) return undefined;

    const distractors = shuffle([...new Set(meaningQuestions
      .map((question) => question.meaning)
      .filter((meaning) => meaning.toLocaleLowerCase() !== previewBase.meaning.toLocaleLowerCase()))]).slice(0, 3);
    if (distractors.length < 3) return previewBase;
    return {
      ...previewBase,
      choiceType: "meaning" as const,
      correctAnswer: previewBase.meaning,
      choices: shuffle([previewBase.meaning, ...distractors]),
    };
  }, [meaningQuestions]);
  const typeWordCount = categoryWords.filter((word) => Boolean(word.imagePath)).length;
  const eligibleWords = useMemo(() => mode === "type-word" ? categoryWords.filter((word) => Boolean(word.imagePath)) : meaningQuestions.map((question) => question.word), [categoryWords, mode, meaningQuestions]);
  const maximumQuestions = eligibleWords.length;
  const selectedQuestionCount = questionCount;
  const showStickyStart = tab === "play" && phase === "setup";
  const currentQuestion = questions[questionIndex];
  const currentAnswer = answers[questionIndex];
  const showStickyGameAction = tab === "play" && phase === "playing" && Boolean(currentQuestion) && (mode === "type-word" || Boolean(currentAnswer));
  const correctCount = Object.values(answers).filter((answer) => answer.correct).length;

  useEffect(() => {
    if (phase !== "playing" || startedAt === null) return;
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [phase, startedAt]);

  useEffect(() => {
    if (phase !== "playing" || currentAnswer?.correct !== true) return;

    const timeout = window.setTimeout(() => {
      if (questionIndex + 1 >= questions.length) {
        setElapsedSeconds(startedAt === null ? 0 : Math.floor((Date.now() - startedAt) / 1000));
        setPhase("results");
        return;
      }

      setQuestionIndex((index) => index + 1);
      setInput("");
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [currentAnswer?.correct, phase, questionIndex, questions.length, startedAt, mode]);

  const loadHistory = useCallback(async (
    forceRefresh = false,
    page = historyPage,
    pageSize = historyPageSize
  ) => {
    if (!userId) return;
    const cachedHistory = getCachedVocabularyQuizHistory(userId, page, pageSize);
    if (cachedHistory && !forceRefresh) {
      setHistory(cachedHistory.rows);
      setHistoryTotal(cachedHistory.total);
      setHistoryError("");
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(!cachedHistory);
    setHistoryError("");
    try {
      const result = await getVocabularyQuizHistory({ page, pageSize, forceRefresh });
      setHistory(result.rows);
      setHistoryTotal(result.total);
    } catch {
      setHistoryError("Could not load quiz history. Please try again.");
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage, historyPageSize, userId]);

  useEffect(() => {
    if (!userId) return;
    if (phase !== "results" || startedAt === null || questions.length === 0 || saveStartedRef.current === startedAt) return;
    saveStartedRef.current = startedAt;
    const completedAt = Date.now();
    const durationSeconds = Math.max(0, Math.floor((completedAt - startedAt) / 1000));
    setElapsedSeconds(durationSeconds);
    setSaveState("saving");
    setSaveError("");

    void saveVocabularyQuizSession({
      mode,
      question_count: questions.length,
      correct_count: correctCount,
      duration_seconds: durationSeconds,
      started_at: new Date(startedAt).toISOString(),
      completed_at: new Date(completedAt).toISOString(),
      answers: questions.map((question, index) => {
        const answer = answers[index];
        const expected = expectedAnswer(question, mode);
        return {
          vocabulary_word_id: question.word.isCustom ? null : question.word.id,
          question_position: index + 1,
          word_text: question.word.word,
          prompt_text: promptText(question, mode),
          expected_answer: expected,
          selected_answer: answer?.value ?? "",
          is_correct: answer?.correct ?? false,
          part_of_speech: question.partOfSpeech,
          choices: question.choices,
          image_path: question.word.imagePath ?? null,
        };
      }),
    }).then(() => {
      setSaveState("saved");
      setHistoryPage(1);
      void loadHistory(true, 1, historyPageSize);
    }).catch((error: unknown) => {
      saveStartedRef.current = null;
      setSaveState("error");
      setSaveError(error instanceof Error ? error.message : "Could not save this quiz attempt.");
    });
  }, [answers, correctCount, historyPageSize, loadHistory, mode, phase, questions, startedAt, userId]);

  function startQuiz() {
    if (maximumQuestions < selectedQuestionCount) return;
    const pool = mode === "type-word"
      ? shuffle(eligibleWords).map((word) => ({ word, meaning: "", partOfSpeech: null, choices: [], choiceType: "word" as const, correctAnswer: word.word }))
      : shuffle(meaningQuestions);
    const nextQuestions = pool.slice(0, selectedQuestionCount);
    if (nextQuestions.length !== selectedQuestionCount) return;
    const now = Date.now();
    setQuestions(nextQuestions);
    setQuestionIndex(0);
    setAnswers({});
    setInput("");
    setElapsedSeconds(0);
    setStartedAt(now);
    setSaveState("idle");
    setSaveError("");
    setPhase("playing");
    setTab("play");
  }

  function submitAnswer(value: string) {
    if (!currentQuestion || currentAnswer || !value.trim()) return;
    const expected = expectedAnswer(currentQuestion, mode);
    if (typeof expected !== "string" || !expected.trim()) return;
    setAnswers((previous) => ({ ...previous, [questionIndex]: { value: value.trim(), correct: normalizeQuizAnswer(value) === normalizeQuizAnswer(expected) } }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitAnswer(input);
  }

  function goToNextQuestion() {
    if (questionIndex + 1 >= questions.length) {
      setElapsedSeconds(startedAt === null ? elapsedSeconds : Math.floor((Date.now() - startedAt) / 1000));
      setPhase("results");
      return;
    }
    setQuestionIndex((index) => index + 1);
    setInput("");
  }

  function backToSetup() {
    setStartedAt(null);
    setPhase("setup");
  }

  async function openHistoryReview(session: VocabularyQuizSessionRow) {
    if (!userId) return;
    setSelectedHistory(session);
    setHistoryError("");
    const cachedAnswers = getCachedVocabularyQuizAnswers(userId, session.id);
    if (cachedAnswers) {
      setHistoryAnswers(cachedAnswers);
      setReviewLoading(false);
      return;
    }
    setReviewLoading(true);
    try {
      setHistoryAnswers(await getVocabularyQuizAnswers(session.id));
    } catch {
      setHistoryAnswers([]);
      setHistoryError("Could not load this quiz review. Please try again.");
    } finally {
      setReviewLoading(false);
    }
  }

  if (!isLoaded) return <p className="py-16 text-sm text-slate-500">Loading quiz vocabulary…</p>;

  const chosenModeLabel = (value: QuizMode) => value === "type-word" ? "Type the word" : "Choose the meaning";
  const quizRating = (score: number, total: number) =>
    total > 0 ? Math.round((score / total) * 5) : 0;

  return (
    <div className={`quiz-page ${showStickyStart || showStickyGameAction ? "pb-24 sm:pb-0" : ""}`}>
      {phase === "playing" ? (
        <button type="button" onClick={backToSetup} className="mb-2 sm:mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
          <ArrowLeft size={16} /> Back to Setup
        </button>
      ) : (
        <Link href="/games" className="mb-2 sm:mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
          <ArrowLeft size={16} /> Back to Games
        </Link>
      )}
      <header className="quiz-hero mb-3 sm:mb-6">
        <h1 className="page-title quiz-title mt-1"><span>Vocabulary</span> <span className="quiz-title-accent">Quiz</span> <Star aria-hidden="true" className="quiz-title-star inline size-6 fill-amber-400 text-amber-400" /></h1>
        <p className="page-intro-description mt-2 hidden sm:block">Choose how many words to practice. We’ll track how long you take.</p>
      </header>

      {phase !== "playing" && (
        <div className="quiz-tabs mb-5 flex gap-2 border-b border-slate-200">
          <TabButton active={tab === "play"} onClick={() => { setTab("play"); setSelectedHistory(null); }}> <Gamepad2 size={16} /> Play quiz</TabButton>
          {userId && <TabButton active={tab === "history"} onClick={() => { setTab("history"); setSelectedHistory(null); void loadHistory(); }}> <History size={16} /> History</TabButton>}
        </div>
      )}

      {tab === "history" && phase !== "playing" && (
        <Card className="quiz-history-card mx-auto max-w-none p-5 sm:p-8">
          {selectedHistory ? (
            <>
              <button type="button" onClick={() => setSelectedHistory(null)} className="quiz-history-back mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"><ArrowLeft size={16} /> All quiz attempts</button>
              <div className="quiz-history-detail-heading mb-5">
                <h2 className="text-2xl font-extrabold text-slate-950">Quiz review</h2>
                <p className="mt-1 text-sm text-slate-500">{new Date(selectedHistory.completed_at).toLocaleString()} · {chosenModeLabel(selectedHistory.mode)} · {formatTime(selectedHistory.duration_seconds)} · {selectedHistory.correct_count}/{selectedHistory.question_count} correct</p>
              </div>
              {reviewLoading ? <p className="py-8 text-center text-sm text-slate-500">Loading answers…</p> : (
                <div className="quiz-history-review-list space-y-3">
                  {historyAnswers.map((answer) => <HistoryAnswer key={answer.id} answer={answer} />)}
                  {historyAnswers.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No saved answers were found.</p>}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="quiz-history-heading mb-5 flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="text-3xl font-extrabold text-slate-950">Your quiz journey <Star aria-hidden="true" className="inline size-5 fill-amber-400 text-amber-400" /></h2><p className="mt-1 text-sm text-slate-500">Review scores, time, and answers from every completed quiz.</p></div>
                <Image src="/images/ui/illustrations/review-trophy.svg" alt="" width={240} height={150} className="quiz-history-art" />
                <Button variant="secondary" onClick={() => void loadHistory(true)} disabled={historyLoading} className="quiz-history-refresh"><RotateCcw size={17} /> Refresh</Button>
              </div>
              {historyError && <AutoDismissMessage key={historyError} variant="error" className="mb-4">{historyError}</AutoDismissMessage>}
              {historyLoading ? <p className="py-10 text-center text-sm text-slate-500">Loading quiz history…</p> : history.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">No completed quizzes yet. Your attempts will appear here.</p>
              ) : (
                <div className="quiz-history-list space-y-3">
                  {history.map((session) => <button key={session.id} type="button" aria-label={`Review quiz attempt: ${session.correct_count} of ${session.question_count} correct, ${chosenModeLabel(session.mode)}, ${formatTime(session.duration_seconds)}`} onClick={() => void openHistoryReview(session)} className="quiz-history-attempt">
                    <span className="quiz-history-score"><span className="quiz-history-medal"><Trophy size={30} fill="currentColor" /></span><span><strong>{session.correct_count}/{session.question_count}</strong><small>correct</small></span></span>
                    <span role="img" aria-label={`${quizRating(session.correct_count, session.question_count)} out of 5 stars`} className="quiz-history-stars">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={30} aria-hidden="true" fill={index < quizRating(session.correct_count, session.question_count) ? "currentColor" : "none"} />)}</span>
                    <time className="quiz-history-date" dateTime={session.completed_at}>{new Date(session.completed_at).toLocaleString()}</time>
                    <span className="quiz-history-mode"><BookOpen size={20} />{chosenModeLabel(session.mode)}</span>
                    <span className="quiz-history-duration"><Clock3 size={22} />{formatTime(session.duration_seconds)}</span>
                    <span className="quiz-history-open" aria-hidden="true"><ChevronRight size={24} /></span>
                  </button>)}
                </div>
              )}
              {!historyLoading && !historyError && historyTotal > 0 && (
                <div className="quiz-history-pagination mt-5 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <p aria-live="polite">
                    Showing {(historyPage - 1) * historyPageSize + 1}–{Math.min(historyPage * historyPageSize, historyTotal)} of {historyTotal} attempts
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                    <label className="flex items-center gap-2 whitespace-nowrap">
                      <span className="relative inline-flex">
                        <select
                          aria-label="Quiz history rows per page"
                          value={historyPageSize}
                          onChange={(event) => {
                            const nextSize = Number(event.target.value);
                            setHistoryPageSize(nextSize);
                            setHistoryPage(1);
                            void loadHistory(false, 1, nextSize);
                          }}
                          className="h-10 w-[76px] cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                        >
                          {[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
                        </select>
                        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500"><ChevronDown size={15} /></span>
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="whitespace-nowrap">Page {historyPage} of {Math.max(1, Math.ceil(historyTotal / historyPageSize))}</span>
                      <Button
                        variant="secondary"
                        aria-label="Previous quiz history page"
                        onClick={() => {
                          const nextPage = Math.max(1, historyPage - 1);
                          setHistoryPage(nextPage);
                          void loadHistory(false, nextPage);
                        }}
                        disabled={historyPage <= 1}
                        className="size-10 px-0"
                      ><ChevronLeft size={17} /></Button>
                      <Button
                        variant="secondary"
                        aria-label="Next quiz history page"
                        onClick={() => {
                          const nextPage = Math.min(Math.ceil(historyTotal / historyPageSize), historyPage + 1);
                          setHistoryPage(nextPage);
                          void loadHistory(false, nextPage);
                        }}
                        disabled={historyPage >= Math.ceil(historyTotal / historyPageSize)}
                        className="size-10 px-0"
                      ><ChevronRight size={17} /></Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {tab === "play" && phase === "setup" && (
        <div className="quiz-setup-grid grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="quiz-setup-card min-w-0 p-5 sm:p-8">
          <div className="quiz-setup-heading flex items-start gap-3"><span className="quiz-setup-icon grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600"><Gamepad2 size={25} /></span><div><h2 className="text-lg font-semibold text-slate-950">Set up your game</h2><p className="mt-1 text-sm text-slate-500">Choose a category, question type, and number of words. There’s no time limit.</p></div><Sparkles aria-hidden="true" className="quiz-setup-spark ml-auto mt-2 size-6 shrink-0" /></div>
          <fieldset className="mt-6"><legend className="mb-3 text-sm font-semibold text-slate-700">Question type</legend>
            <div className="grid grid-cols-2 gap-2 sm:hidden">
              <CompactModeButton active={mode === "choose-meaning"} title="Choose meaning" count={meaningQuestions.length} onClick={() => setMode("choose-meaning")} />
              <CompactModeButton active={mode === "type-word"} title="Type word" count={typeWordCount} onClick={() => setMode("type-word")} />
            </div>
            <div className="hidden gap-3 sm:grid sm:grid-cols-2">
              <ModeCard active={mode === "choose-meaning"} title="Choose the meaning" description="Match a word or meaning with the correct answer from four choices." count={meaningQuestions.length} onClick={() => setMode("choose-meaning")} />
              <ModeCard active={mode === "type-word"} title="Type the word" description="Look at an image and type the vocabulary word." count={typeWordCount} onClick={() => setMode("type-word")} />
            </div>
          </fieldset>
          <fieldset className="mt-6"><legend className="mb-3 text-sm font-semibold text-slate-700">Category</legend><p className="mb-3 text-xs text-slate-500">Choose a category for this quiz.</p>
            <div id="quiz-categories" className={`grid grid-cols-3 gap-2 overflow-hidden transition-[max-height] duration-200 sm:grid-cols-5 ${categoriesExpanded ? "max-h-[1000px]" : "max-h-[11.5rem] sm:max-h-[5.5rem] lg:max-h-[11.5rem]"}`}>
              {categoryOptions.map((item) => <QuizCategoryChip key={item.id} name={item.name} imagePath={item.imagePath} dotClassName={CATEGORY_DOT_STYLES[item.color]} selected={category === item.value} onClick={() => setCategory(item.value)} />)}
            </div>
            {categoryOptions.length > 8 && <div className={`mt-2 flex justify-center ${categoryOptions.length <= 12 ? "hidden" : ""} ${categoryOptions.length <= 10 ? "sm:hidden" : "sm:flex"} ${categoryOptions.length <= 20 ? "lg:hidden" : "lg:flex"}`}>
              <button type="button" aria-expanded={categoriesExpanded} aria-controls="quiz-categories" onClick={() => setCategoriesExpanded((expanded) => !expanded)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                {categoriesExpanded ? "Show less" : "More"}{categoriesExpanded ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
              </button>
            </div>}
            <p className="mt-2 text-xs text-slate-500">Questions and answer choices will use words from this category.</p>
          </fieldset>
          <fieldset className="mt-6"><legend className="mb-3 text-sm font-semibold text-slate-700">Number of words</legend><div className="flex flex-wrap gap-2">
            {QUESTION_COUNTS.map((count) => <ChoiceButton key={count} active={selectedQuestionCount === count} disabled={count > maximumQuestions} onClick={() => setQuestionCount(count)}>{count}</ChoiceButton>)}
          </div><p className="mt-2 text-xs text-slate-500">{maximumQuestions} eligible questions available. Only complete sets of 10, 20, or 30 can be started.</p></fieldset>
          {maximumQuestions < 10 && <AutoDismissMessage variant="warning" className="mt-5">{mode === "type-word" ? "Add images to at least 10 vocabulary words to play this question type." : "Add at least 10 eligible vocabulary words with enough distinct words or meanings to create answer choices."}</AutoDismissMessage>}
          <div className="quiz-start-row mt-7 hidden justify-end sm:flex"><Button onClick={startQuiz} disabled={maximumQuestions < selectedQuestionCount}><Play size={18} fill="currentColor" /> Start quiz <ArrowRight className="quiz-start-arrow" size={18} /></Button></div>
        </Card>
        <QuizPreview mode={mode} category={category} questionCount={questionCount} meaningQuestion={previewMeaningQuestion} typeWord={categoryWords.find((word) => Boolean(word.imagePath))} />
        </div>
      )}

      {showStickyStart && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
          <Button
            onClick={startQuiz}
            disabled={maximumQuestions < selectedQuestionCount}
            className="min-h-12 w-full"
          >
            <Gamepad2 size={17} /> Start quiz
          </Button>
        </div>
      )}

      {showStickyGameAction && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
          {mode === "type-word" && !currentAnswer ? (
            <Button
              type="submit"
              form="quiz-type-word-answer"
              disabled={!input.trim()}
              className="min-h-12 w-full"
            >
              Check answer
            </Button>
          ) : (
            <div className="w-full">
              <Button onClick={goToNextQuestion} className="min-h-12 w-full">
                {questionIndex + 1 === questions.length ? "See results" : "Next question"}
              </Button>
            </div>
          )}
        </div>
      )}

      {phase === "playing" && currentQuestion && (
        <Card className="quiz-game-card mx-auto max-w-5xl p-5 sm:p-8">
          <div className="quiz-game-topbar sticky top-25 z-20 -mx-5 -mt-5 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border-b border-slate-100 bg-white/95 px-5 py-3 backdrop-blur lg:top-0 lg:mx-0 lg:mt-0 lg:rounded-none lg:px-0 lg:py-0 lg:pb-4"><button type="button" onClick={backToSetup} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"><ArrowLeft size={16} /> Exit quiz</button><div className="flex items-center gap-4 text-sm"><span className="text-slate-500">Question {questionIndex + 1} of {questions.length}</span><span className="inline-flex items-center gap-1.5 font-semibold text-slate-700"><Clock3 size={16} /> {formatTime(elapsedSeconds)}</span></div></div>
          <div className="quiz-game-progress mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>
          <div className="quiz-game-prompt flex md:min-h-[360px] flex-col items-center justify-center pt-3 sm:pt-6 text-center">
            {mode === "type-word" ? <><QuizImage word={currentQuestion.word} className="quiz-game-image" /><p className="mt-5 inline-flex items-center gap-1.5 text-sm text-slate-500">What is this word?<PronunciationButton word={currentQuestion.word.word} /></p><form id="quiz-type-word-answer" onSubmit={handleSubmit} className="mt-4 flex w-full max-w-md flex-col gap-3 sm:flex-row"><input autoFocus value={input} onChange={(event) => setInput(event.target.value)} disabled={Boolean(currentAnswer)} aria-label="Type the vocabulary word" placeholder="Type the word…" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-center text-base outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50" />{!currentAnswer && <Button type="submit" disabled={!input.trim()} className="hidden sm:inline-flex">Check</Button>}</form></> : <>
              {currentQuestion.choiceType === "word"
                ? <p className="text-3xl font-bold text-slate-950 sm:text-4xl">{currentQuestion.meaning}</p>
                : currentQuestion.word.imagePath ? <QuizImage word={currentQuestion.word} className="quiz-game-image" /> : <p className="text-3xl font-bold text-slate-950 sm:text-4xl">{currentQuestion.word.word}</p>}
              {currentQuestion.partOfSpeech && <span className="mt-4 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium capitalize text-blue-700">{currentQuestion.partOfSpeech}</span>}
              <p className="mt-4 text-sm text-slate-500">{currentQuestion.choiceType === "word" ? "Choose the matching word" : "Choose the correct meaning"}</p><div className="quiz-game-answers mt-4 grid w-full max-w-3xl gap-3 grid-cols-2">{currentQuestion.choices.map((choice, index) => <button key={`${choice}-${index}`} type="button" disabled={Boolean(currentAnswer)} onClick={() => submitAnswer(choice)} className={`quiz-game-answer min-h-14 rounded-xl border px-4 py-3 text-left text-sm transition disabled:cursor-default ${currentAnswer && choice === expectedAnswer(currentQuestion, mode) ? "is-correct border-emerald-300 bg-emerald-50 font-medium text-emerald-800" : currentAnswer?.value === choice && !currentAnswer.correct ? "is-wrong border-red-300 bg-red-50 font-medium text-red-800" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"}`}><span className="quiz-answer-letter">{String.fromCharCode(65 + index)}</span>{choice}</button>)}</div>
            </>}
            {currentAnswer && <div className="quiz-game-feedback mt-5 flex w-full max-w-3xl flex-col items-center gap-3" role="status">{currentAnswer.correct ? <p className="quiz-correct-feedback"><Star size={24} fill="currentColor" /> Correct! <span>Great job! 🎉</span></p> : <AutoDismissMessage key={`${questionIndex}:${currentAnswer.value}`} variant="error" className="inline-flex items-center gap-2 bg-transparent p-0 font-semibold"><X size={17} />{`The answer is: ${expectedAnswer(currentQuestion, mode)}`}</AutoDismissMessage>}<Button onClick={goToNextQuestion} className="hidden sm:inline-flex">{questionIndex + 1 === questions.length ? "See results" : "Next question"}</Button></div>}
          </div>
        </Card>
      )}

      {tab === "play" && phase === "results" && (
        <Card className="mx-auto max-w-3xl p-5 sm:p-8">
          <div className="mb-5 flex flex-wrap justify-between gap-2"><Button variant="secondary" onClick={backToSetup}><ArrowLeft size={16} /> Setup</Button><Button onClick={startQuiz}><RotateCcw size={16} /> Play again</Button></div>
          <div className="text-center"><p className="text-sm font-medium text-blue-600">Quiz complete</p><h2 className="mt-2 text-3xl font-bold text-slate-950">{correctCount} / {questions.length}</h2><p className="mt-2 text-sm text-slate-500">Correct answers · {formatTime(elapsedSeconds)} elapsed</p>
          {saveState === "saving" && <p role="status" className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500"><LoaderCircle size={15} className="animate-spin" />Saving your quiz history…</p>}
          {saveState === "saved" && <AutoDismissMessage variant="success" className="mx-auto mt-3 w-fit">Attempt saved to your history.</AutoDismissMessage>}
          {saveState === "error" && <AutoDismissMessage key={saveError} variant="error" className="mx-auto mt-3 w-fit">History was not saved: {saveError}</AutoDismissMessage>}
            {saveState === "error" && <button type="button" onClick={() => { saveStartedRef.current = null; setPhase("setup"); setTimeout(() => setPhase("results"), 0); }} className="ml-2 text-sm font-semibold text-blue-700 underline">Retry save</button>}
          </div>
          <div className="mt-7 flex flex-col gap-3">{questions.map((question, index) => { const answer = answers[index]; const expected = expectedAnswer(question, mode); const prompt = mode === "choose-meaning" && question.choiceType === "word" ? question.meaning : question.word.word; return <div key={`${question.word.id}-${index}`} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4"><div className="min-w-0"><p className="font-semibold text-slate-900">{prompt}</p>{mode === "choose-meaning" && <p className="mt-1 text-sm text-slate-600">Correct answer: {expected}</p>}{!answer ? <p className="mt-1 text-xs text-slate-400">Not answered</p> : !answer.correct ? <p className="mt-1 text-xs text-red-600">Your answer: {answer.value}</p> : null}</div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${answer?.correct ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{answer?.correct ? "Correct" : "Review"}</span></div>; })}</div>
        </Card>
      )}
    </div>
  );
}

function HistoryAnswer({ answer }: { answer: VocabularyQuizAnswerRow }) {
  const userAnsweredCorrectly = answer.is_correct;
  return <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4"><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Question {answer.question_position} · {answer.prompt_text}</p><p className="mt-1 font-semibold text-slate-900">{answer.word_text}</p>{answer.part_of_speech && <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs capitalize text-blue-700">{answer.part_of_speech}</span>}<p className="mt-2 text-sm text-slate-700">Correct answer: {answer.expected_answer}</p>{!userAnsweredCorrectly && <p className="mt-1 text-sm text-red-600">Your answer: {answer.selected_answer || "No answer"}</p>}</div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${userAnsweredCorrectly ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{userAnsweredCorrectly ? "Correct" : "Review"}</span></div>;
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium ${active ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{children}</button>;
}

function ModeCard({ active, title, description, count, onClick }: { active: boolean; title: string; description: string; count: number; onClick: () => void }) {
  const icon = title.startsWith("Choose") ? "💬" : "✏️";
  return <button type="button" aria-pressed={active} onClick={onClick} className={`quiz-mode-card cursor-pointer rounded-xl border p-4 text-left transition ${active ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"}`}><span className="flex items-center gap-3"><span className="quiz-mode-illustration" aria-hidden="true">{icon}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="font-bold text-slate-900">{title}</span><span className="quiz-mode-check">{active ? <Check size={14} strokeWidth={3} /> : null}</span></span><span className="mt-1 block text-xs leading-4 text-slate-500">{description}</span></span></span><span className="quiz-mode-count">{count} words available</span></button>;
}

function CompactModeButton({ active, title, count, onClick }: { active: boolean; title: string; count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`${title}, ${count} available`}
      onClick={onClick}
      className={`flex min-h-[68px] min-w-0 flex-col items-start justify-center rounded-xl border px-3 py-2 text-left transition ${active ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-200"}`}
    >
      <span className="flex items-center gap-1.5 text-sm font-semibold leading-5 text-slate-900"><span aria-hidden="true">{title.startsWith("Choose") ? "💬" : "✏️"}</span>{title}</span>
      <span className="mt-0.5 text-xs text-slate-500">{count} available</span>
    </button>
  );
}

function ChoiceButton({ active, disabled = false, onClick, children }: { active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={active} disabled={disabled} onClick={onClick} className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50"}`}>{children}</button>;
}
