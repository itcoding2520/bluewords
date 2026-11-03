"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Gamepad2, History, Star } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { QuizGamePanel } from "@/components/quiz/QuizGamePanel";
import { QuizSetupPanel } from "@/components/quiz/QuizSetupPanel";
import { QuizResultsPanel } from "@/components/quiz/QuizResultsPanel";
import { QuizHistoryPanel } from "@/components/quiz/QuizHistoryPanel";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { saveVocabularyQuizSession } from "@/lib/supabase/quiz";
import { normalizeQuizAnswer } from "@/lib/supabase/normalize-quiz-answer.mjs";
import { expectedAnswer, formatQuizTime as formatTime, promptText, shuffle, type QuizAnswer, type QuizMode, type QuizQuestion } from "@/lib/quiz-model";
import { useVocabularyQuizHistory } from "@/hooks/useVocabularyQuizHistory";
import { useQuizSetupData } from "@/hooks/useQuizSetupData";
import { useQuizProgression } from "@/hooks/useQuizProgression";

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
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const saveStartedRef = useRef<number | null>(null);

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
  }, [answers, correctCount, historyPageSize, loadHistory, mode, phase, questions, setHistoryPage, startedAt, userId]);

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
            saveStartedRef.current = null;
            setPhase("setup");
            setTimeout(() => setPhase("results"), 0);
          }}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium ${active ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{children}</button>;
}
