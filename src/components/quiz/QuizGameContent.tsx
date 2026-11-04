"use client";

import { useState } from "react";

import { QuizGamePanel } from "@/components/quiz/QuizGamePanel";
import { QuizSetupPanel } from "@/components/quiz/QuizSetupPanel";
import { QuizResultsPanel } from "@/components/quiz/QuizResultsPanel";
import { QuizHistoryPanel } from "@/components/quiz/QuizHistoryPanel";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { normalizeQuizAnswer } from "@/lib/supabase/normalize-quiz-answer.mjs";
import { expectedAnswer, formatQuizTime as formatTime, shuffle, type QuizAnswer, type QuizMode, type QuizQuestion } from "@/lib/quiz-model";
import { useVocabularyQuizHistory } from "@/hooks/useVocabularyQuizHistory";
import { useQuizSetupData } from "@/hooks/useQuizSetupData";
import { useQuizProgression } from "@/hooks/useQuizProgression";
import { useQuizSessionSave } from "@/hooks/useQuizSessionSave";
import { QuizStickyActions } from "@/components/quiz/QuizStickyActions";
import { QuizPageHeader } from "@/components/quiz/QuizPageHeader";

type Phase = "setup" | "playing" | "results";
type Tab = "play" | "history";

export function QuizGameContent({ userId }: { userId: string | null }) {
  const { words, categories, isLoaded } = useVocabulary();
  const {
    history,
    historyPage,
    setHistoryPage,
    historyPageSize,
    setHistoryPageSize,
    historyTotal,
    historyLoading,
    historyError,
    selectedHistory,
    setSelectedHistory,
    historyAnswers,
    reviewLoading,
    loadHistory,
    openHistoryReview,
  } = useVocabularyQuizHistory(userId);
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
  const {
    categoryWords,
    categoryOptions,
    meaningQuestions,
    previewMeaningQuestion,
    typeWordCount,
    eligibleWords,
    maximumQuestions,
  } = useQuizSetupData({ words, categories, category, mode });
  const selectedQuestionCount = questionCount;
  const showStickyStart = tab === "play" && phase === "setup";
  const currentQuestion = questions[questionIndex];
  const currentAnswer = answers[questionIndex];
  const showStickyGameAction = tab === "play" && phase === "playing" && Boolean(currentQuestion) && (mode === "type-word" || Boolean(currentAnswer));
  const correctCount = Object.values(answers).filter((answer) => answer.correct).length;
  const { saveState, saveError, resetSaveState, allowRetry } = useQuizSessionSave({
    userId,
    phase,
    startedAt,
    mode,
    questions,
    answers,
    correctCount,
    historyPageSize,
    setHistoryPage,
    setElapsedSeconds,
    loadHistory,
  });

  useQuizProgression({
    phase,
    startedAt,
    currentAnswerIsCorrect: currentAnswer?.correct === true,
    questionIndex,
    questionCount: questions.length,
    setElapsedSeconds,
    setPhase,
    setQuestionIndex,
    setInput,
  });

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
    resetSaveState();
    setPhase("playing");
    setTab("play");
  }

  function submitAnswer(value: string) {
    if (!currentQuestion || currentAnswer || !value.trim()) return;
    const expected = expectedAnswer(currentQuestion, mode);
    if (typeof expected !== "string" || !expected.trim()) return;
    setAnswers((previous) => ({ ...previous, [questionIndex]: { value: value.trim(), correct: normalizeQuizAnswer(value) === normalizeQuizAnswer(expected) } }));
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

  if (!isLoaded) return <p className="py-16 text-sm text-slate-500">Loading quiz vocabulary…</p>;

  return (
    <div className={`quiz-page ${showStickyStart || showStickyGameAction ? "pb-24 sm:pb-0" : ""}`}>
      <QuizPageHeader
        isPlaying={phase === "playing"}
        activeTab={tab}
        showHistory={userId !== null && phase !== "playing"}
        onPlay={() => {
          if (phase === "playing") {
            backToSetup();
            return;
          }
          setTab("play");
          setSelectedHistory(null);
        }}
        onHistory={() => {
          setTab("history");
          setSelectedHistory(null);
          void loadHistory();
        }}
      />

      {tab === "history" && phase !== "playing" && (
        <QuizHistoryPanel
          selected={selectedHistory}
          answers={historyAnswers}
          sessions={history}
          loading={historyLoading}
          reviewLoading={reviewLoading}
          error={historyError}
          total={historyTotal}
          page={historyPage}
          pageSize={historyPageSize}
          formatTime={formatTime}
          onBack={() => setSelectedHistory(null)}
          onRefresh={() => void loadHistory(true)}
          onOpenReview={(session) => void openHistoryReview(session)}
          onPageSizeChange={(size) => {
            setHistoryPageSize(size);
            setHistoryPage(1);
            void loadHistory(false, 1, size);
          }}
          onPageChange={(nextPage) => {
            setHistoryPage(nextPage);
            void loadHistory(false, nextPage);
          }}
        />
      )}

      {tab === "play" && phase === "setup" && (
        <QuizSetupPanel
          mode={mode}
          onModeChange={setMode}
          category={category}
          onCategoryChange={setCategory}
          categoriesExpanded={categoriesExpanded}
          onToggleCategories={() => setCategoriesExpanded((expanded) => !expanded)}
          questionCount={questionCount}
          onQuestionCountChange={setQuestionCount}
          maximumQuestions={maximumQuestions}
          meaningQuestions={meaningQuestions}
          typeWordCount={typeWordCount}
          categoryOptions={categoryOptions}
          previewMeaningQuestion={previewMeaningQuestion}
          previewTypeWord={categoryWords.find((word) => Boolean(word.imagePath))}
          onStart={startQuiz}
        />
      )}

      <QuizStickyActions
        showStart={showStickyStart}
        showGameAction={showStickyGameAction}
        canStart={maximumQuestions >= selectedQuestionCount}
        mode={mode}
        input={input}
        answer={currentAnswer}
        questionIndex={questionIndex}
        questionCount={questions.length}
        onStart={startQuiz}
        onNext={goToNextQuestion}
      />

      {phase === "playing" && currentQuestion && (
        <QuizGamePanel
          question={currentQuestion}
          mode={mode}
          questionIndex={questionIndex}
          questionCount={questions.length}
          answer={currentAnswer}
          input={input}
          elapsedSeconds={elapsedSeconds}
          onExit={backToSetup}
          onInputChange={setInput}
          onSubmitAnswer={submitAnswer}
          onNext={goToNextQuestion}
        />
      )}

      {tab === "play" && phase === "results" && (
        <QuizResultsPanel
          questions={questions}
          answers={answers}
          mode={mode}
          correctCount={correctCount}
          elapsedSeconds={elapsedSeconds}
          saveState={saveState}
          saveError={saveError}
          onSetup={backToSetup}
          onPlayAgain={startQuiz}
          onRetrySave={() => {
            allowRetry();
            setPhase("setup");
            setTimeout(() => setPhase("results"), 0);
          }}
        />
      )}
    </div>
  );
}
