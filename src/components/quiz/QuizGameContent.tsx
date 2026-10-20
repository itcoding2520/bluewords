"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Gamepad2, History, LoaderCircle, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { VocabularyMeaning, VocabularyWord } from "@/data/vocabulary";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { CategoryDropdown } from "@/components/vocabulary/VocabularyToolbar";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
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
}

interface QuizAnswer {
  value: string;
  correct: boolean;
}

const QUESTION_COUNTS = [10, 20, 30] as const;

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

  return shuffle(words.flatMap((word) => {
    const wordMeanings = meaningsFor(word);
    if (wordMeanings.length === 0) return [];
    const meaning = shuffle(wordMeanings)[0];
    const distractors = shuffle(uniqueAnswers
      .filter((answer) => answer.meaning.toLocaleLowerCase() !== meaning.meaning.trim().toLocaleLowerCase())
      .map((answer) => answer.meaning)).slice(0, 3);
    if (distractors.length < 3) return [];
    return [{
      word,
      meaning: meaning.meaning.trim(),
      partOfSpeech: word.type !== "expression" && word.detailedMeanings?.some((item) => item.meaning.trim()) ? meaning.partOfSpeech : null,
      choices: shuffle([meaning.meaning.trim(), ...distractors]),
    }];
  }));
}

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours ? `${hours}:` : ""}${String(minutes).padStart(hours ? 2 : 1, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function QuizImage({ word, className = "" }: { word: VocabularyWord; className?: string }) {
  const imageUrl = useVocabularyImageUrl(word.imagePath);
  if (!imageUrl) return <div className={`grid size-48 place-items-center rounded-2xl bg-slate-100 text-center text-sm text-slate-400 ${className}`}>{word.imagePath ? "Loading image…" : "No image"}</div>;
  return <Image src={imageUrl} alt="Vocabulary quiz prompt" width={240} height={240} unoptimized className={`size-48 rounded-2xl border border-slate-100 object-cover ${className}`} />;
}

export function QuizGameContent({ userId }: { userId: string }) {
  const { words, categories, isLoaded } = useVocabulary();
  const [mode, setMode] = useState<QuizMode>("choose-meaning");
  const [category, setCategory] = useState("all");
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
  const meaningQuestions = useMemo(() => buildMeaningQuestions(categoryWords), [categoryWords]);
  const eligibleWords = useMemo(() => mode === "type-word" ? categoryWords.filter((word) => Boolean(word.imagePath)) : meaningQuestions.map((question) => question.word), [categoryWords, mode, meaningQuestions]);
  const maximumQuestions = eligibleWords.length;
  const selectedQuestionCount = questionCount;
  const currentQuestion = questions[questionIndex];
  const currentAnswer = answers[questionIndex];
  const correctCount = Object.values(answers).filter((answer) => answer.correct).length;

  useEffect(() => {
    if (phase !== "playing" || startedAt === null) return;
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [phase, startedAt]);

  const loadHistory = useCallback(async (
    forceRefresh = false,
    page = historyPage,
    pageSize = historyPageSize
  ) => {
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
        const expected = mode === "type-word" ? question.word.word : question.meaning;
        return {
          vocabulary_word_id: question.word.id,
          question_position: index + 1,
          word_text: question.word.word,
          prompt_text: mode === "type-word" ? "Image → Type the word" : question.word.imagePath ? "Image → Choose the meaning" : "Word → Choose the meaning",
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
  }, [answers, correctCount, historyPageSize, loadHistory, mode, phase, questions, startedAt]);

  function startQuiz() {
    if (maximumQuestions < selectedQuestionCount) return;
    const pool = mode === "type-word"
      ? shuffle(eligibleWords).map((word) => ({ word, meaning: "", partOfSpeech: null, choices: [] }))
      : meaningQuestions;
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
    const expected = mode === "type-word" ? currentQuestion.word.word : currentQuestion.meaning;
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
  const scoreLabel = (score: number, total: number) => `${total ? Math.round((score / total) * 100) : 0}%`;

  return (
    <div>
      <header className="mb-6">
        <p className="text-sm font-medium text-blue-600">Practice through play</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Vocabulary Quiz</h1>
        <p className="mt-2 text-sm text-slate-500">Choose how many words to practice. We’ll track how long you take.</p>
      </header>

      {phase !== "playing" && (
        <div className="mb-5 flex gap-2 border-b border-slate-200">
          <TabButton active={tab === "play"} onClick={() => { setTab("play"); setSelectedHistory(null); }}> <Gamepad2 size={16} /> Play quiz</TabButton>
          <TabButton active={tab === "history"} onClick={() => { setTab("history"); setSelectedHistory(null); void loadHistory(); }}> <History size={16} /> History</TabButton>
        </div>
      )}

      {tab === "history" && phase !== "playing" && (
        <Card className="mx-auto max-w-4xl p-5 sm:p-8">
          {selectedHistory ? (
            <>
              <button type="button" onClick={() => setSelectedHistory(null)} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> All quiz attempts</button>
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-950">Quiz review</h2>
                <p className="mt-1 text-sm text-slate-500">{new Date(selectedHistory.completed_at).toLocaleString()} · {chosenModeLabel(selectedHistory.mode)} · {formatTime(selectedHistory.duration_seconds)} · {selectedHistory.correct_count}/{selectedHistory.question_count} correct</p>
              </div>
              {reviewLoading ? <p className="py-8 text-center text-sm text-slate-500">Loading answers…</p> : (
                <div className="space-y-3">
                  {historyAnswers.map((answer) => <HistoryAnswer key={answer.id} answer={answer} />)}
                  {historyAnswers.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No saved answers were found.</p>}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="text-xl font-semibold text-slate-950">Your quiz journey</h2><p className="mt-1 text-sm text-slate-500">Review scores, time, and answers from every completed quiz.</p></div>
                <Button variant="secondary" onClick={() => void loadHistory(true)} disabled={historyLoading}><RotateCcw size={15} /> Refresh</Button>
              </div>
              {historyError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{historyError}</p>}
              {historyLoading ? <p className="py-10 text-center text-sm text-slate-500">Loading quiz history…</p> : history.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">No completed quizzes yet. Your attempts will appear here.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((session) => <button key={session.id} type="button" onClick={() => void openHistoryReview(session)} className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40">
                    <span><span className="block font-semibold text-slate-900">{session.correct_count}/{session.question_count} correct <span className="ml-1 text-sm font-medium text-blue-600">{scoreLabel(session.correct_count, session.question_count)}</span></span><span className="mt-1 block text-xs text-slate-500">{new Date(session.completed_at).toLocaleString()} · {chosenModeLabel(session.mode)}</span></span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600"><Clock3 size={15} /> {formatTime(session.duration_seconds)} <span aria-hidden="true" className="ml-2 text-slate-400">›</span></span>
                  </button>)}
                </div>
              )}
              {!historyLoading && !historyError && historyTotal > 0 && (
                <div className="mt-5 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <p aria-live="polite">
                    Showing {(historyPage - 1) * historyPageSize + 1}–{Math.min(historyPage * historyPageSize, historyTotal)} of {historyTotal} attempts
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                    <label className="flex items-center gap-2 whitespace-nowrap">
                      Rows per page
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
        <Card className="mx-auto max-w-3xl p-5 sm:p-8">
          <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Gamepad2 size={22} /></span><div><h2 className="text-lg font-semibold text-slate-950">Set up your game</h2><p className="mt-1 text-sm text-slate-500">Choose a category, question type, and number of words. There’s no time limit.</p></div></div>
          <fieldset className="mt-6"><legend className="mb-3 text-sm font-semibold text-slate-700">Question type</legend><div className="grid gap-3 sm:grid-cols-2">
            <ModeCard active={mode === "choose-meaning"} title="Choose the meaning" description="See a word or image and select its meaning from four choices." count={meaningQuestions.length} onClick={() => setMode("choose-meaning")} />
            <ModeCard active={mode === "type-word"} title="Type the word" description="Look at an image and type the vocabulary word." count={categoryWords.filter((word) => Boolean(word.imagePath)).length} onClick={() => setMode("type-word")} />
          </div></fieldset>
          <fieldset className="mt-6"><legend className="mb-3 text-sm font-semibold text-slate-700">Category</legend><div className="w-full md:w-1/2"><CategoryDropdown category={category} categories={categories} onChange={setCategory} includeAll allLabel="All categories" fullWidth /></div><p className="mt-2 text-xs text-slate-500">Questions and answer choices will use words from this category.</p></fieldset>
          <fieldset className="mt-6"><legend className="mb-3 text-sm font-semibold text-slate-700">Number of words</legend><div className="flex flex-wrap gap-2">
            {QUESTION_COUNTS.map((count) => <ChoiceButton key={count} active={selectedQuestionCount === count} disabled={count > maximumQuestions} onClick={() => setQuestionCount(count)}>{count}</ChoiceButton>)}
          </div><p className="mt-2 text-xs text-slate-500">{maximumQuestions} eligible questions available. Only complete sets of 10, 20, or 30 can be started.</p></fieldset>
          {maximumQuestions < 10 && <p role="status" className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{mode === "type-word" ? "Add images to at least 10 vocabulary words to play this question type." : "Add vocabulary with meanings from at least four distinct answers, and have at least 10 eligible words."}</p>}
          <div className="mt-7 flex justify-end"><Button onClick={startQuiz} disabled={maximumQuestions < selectedQuestionCount}><Gamepad2 size={17} /> Start quiz</Button></div>
        </Card>
      )}

      {phase === "playing" && currentQuestion && (
        <Card className="mx-auto max-w-3xl p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4"><button type="button" onClick={backToSetup} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> Exit quiz</button><div className="flex items-center gap-4 text-sm"><span className="text-slate-500">Question {questionIndex + 1} of {questions.length}</span><span className="inline-flex items-center gap-1.5 font-semibold text-slate-700"><Clock3 size={16} /> {formatTime(elapsedSeconds)}</span></div></div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>
          <div className="flex min-h-[360px] flex-col items-center justify-center py-8 text-center">
            {mode === "type-word" ? <><QuizImage word={currentQuestion.word} /><p className="mt-5 text-sm text-slate-500">What is this word?</p><form onSubmit={handleSubmit} className="mt-4 flex w-full max-w-md flex-col gap-3 sm:flex-row"><input autoFocus value={input} onChange={(event) => setInput(event.target.value)} disabled={Boolean(currentAnswer)} aria-label="Type the vocabulary word" placeholder="Type the word…" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-center text-base outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50" />{!currentAnswer && <Button type="submit" disabled={!input.trim()}>Check</Button>}</form></> : <>
              {currentQuestion.word.imagePath ? <QuizImage word={currentQuestion.word} /> : <p className="text-3xl font-bold text-slate-950 sm:text-4xl">{currentQuestion.word.word}</p>}
              {currentQuestion.partOfSpeech && <span className="mt-4 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium capitalize text-blue-700">{currentQuestion.partOfSpeech}</span>}
              <p className="mt-4 text-sm text-slate-500">Choose the correct meaning</p><div className="mt-4 grid w-full max-w-xl gap-2 sm:grid-cols-2">{currentQuestion.choices.map((choice, index) => <button key={`${choice}-${index}`} type="button" disabled={Boolean(currentAnswer)} onClick={() => submitAnswer(choice)} className={`min-h-12 rounded-xl border px-4 py-3 text-left text-sm transition disabled:cursor-default ${currentAnswer && choice === currentQuestion.meaning ? "border-emerald-300 bg-emerald-50 font-medium text-emerald-800" : currentAnswer?.value === choice && !currentAnswer.correct ? "border-red-300 bg-red-50 font-medium text-red-800" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"}`}><span className="mr-2 text-xs font-semibold text-slate-400">{String.fromCharCode(65 + index)}.</span>{choice}</button>)}</div>
            </>}
            {currentAnswer && <div className="mt-5 flex w-full max-w-xl flex-col items-center gap-3" role="status"><p className={`inline-flex items-center gap-2 text-sm font-semibold ${currentAnswer.correct ? "text-emerald-700" : "text-red-700"}`}>{currentAnswer.correct ? <Check size={17} /> : <X size={17} />}{currentAnswer.correct ? "Correct!" : `The answer is: ${mode === "type-word" ? currentQuestion.word.word : currentQuestion.meaning}`}</p><Button onClick={goToNextQuestion}>{questionIndex + 1 === questions.length ? "See results" : "Next question"}</Button></div>}
          </div>
        </Card>
      )}

      {tab === "play" && phase === "results" && (
        <Card className="mx-auto max-w-3xl p-5 sm:p-8">
          <div className="text-center"><p className="text-sm font-medium text-blue-600">Quiz complete</p><h2 className="mt-2 text-3xl font-bold text-slate-950">{correctCount} / {questions.length}</h2><p className="mt-2 text-sm text-slate-500">Correct answers · {formatTime(elapsedSeconds)} elapsed</p>
            <p role={saveState === "error" ? "alert" : "status"} className={`mt-3 inline-flex items-center gap-2 text-sm ${saveState === "error" ? "text-red-700" : "text-slate-500"}`}>{saveState === "saving" && <LoaderCircle size={15} className="animate-spin" />}{saveState === "saved" ? "Attempt saved to your history." : saveState === "saving" ? "Saving your quiz history…" : saveState === "error" ? `History was not saved: ${saveError}` : ""}</p>
            {saveState === "error" && <button type="button" onClick={() => { saveStartedRef.current = null; setPhase("setup"); setTimeout(() => setPhase("results"), 0); }} className="ml-2 text-sm font-semibold text-blue-700 underline">Retry save</button>}
          </div>
          <div className="mt-7 flex flex-col gap-3">{questions.map((question, index) => { const answer = answers[index]; const expected = mode === "type-word" ? question.word.word : question.meaning; return <div key={`${question.word.id}-${index}`} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4"><div className="min-w-0"><p className="font-semibold text-slate-900">{question.word.word}</p>{mode === "choose-meaning" && <p className="mt-1 text-sm text-slate-600">{expected}</p>}{!answer ? <p className="mt-1 text-xs text-slate-400">Not answered</p> : !answer.correct ? <p className="mt-1 text-xs text-red-600">Your answer: {answer.value}</p> : null}</div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${answer?.correct ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{answer?.correct ? "Correct" : "Review"}</span></div>; })}</div>
          <div className="mt-6 flex flex-wrap justify-end gap-2"><Button variant="secondary" onClick={backToSetup}><ArrowLeft size={16} /> Setup</Button><Button onClick={startQuiz}><RotateCcw size={16} /> Play again</Button></div>
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
  return <button type="button" aria-pressed={active} onClick={onClick} className={`rounded-xl border p-4 text-left transition ${active ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"}`}><span className="flex items-center justify-between gap-3"><span className="font-semibold text-slate-900">{title}</span><span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">{count} available</span></span><span className="mt-2 block text-sm leading-5 text-slate-500">{description}</span></button>;
}

function ChoiceButton({ active, disabled = false, onClick, children }: { active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={active} disabled={disabled} onClick={onClick} className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50"}`}>{children}</button>;
}
