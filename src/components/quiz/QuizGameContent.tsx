"use client";

import { QuizGamePanel } from "@/components/quiz/QuizGamePanel";
import { QuizHistoryPanel } from "@/components/quiz/QuizHistoryPanel";
import { QuizPageHeader } from "@/components/quiz/QuizPageHeader";
import { QuizResultsPanel } from "@/components/quiz/QuizResultsPanel";
import { QuizSetupPanel } from "@/components/quiz/QuizSetupPanel";
import { QuizStickyActions } from "@/components/quiz/QuizStickyActions";
import { useQuizExperience } from "@/hooks/useQuizExperience";
import { formatClockDuration } from "@/lib/clock-duration";

export function QuizGameContent({ userId }: { userId: string | null }) {
  const quiz = useQuizExperience(userId);
  const { configuration, setup, history, navigation, session } = quiz;
  const showStickyStart = quiz.tab === "play" && session.phase === "setup";
  const showStickyGameAction = quiz.tab === "play"
    && session.phase === "playing"
    && Boolean(session.currentQuestion)
    && (configuration.mode === "type-word" || Boolean(session.currentAnswer));

  if (!quiz.isLoaded) return <p className="py-16 text-sm text-slate-500">Loading quiz vocabulary…</p>;

  return (
    <div className={`quiz-page ${showStickyStart || showStickyGameAction ? "pb-24 sm:pb-0" : ""}`}>
      <QuizPageHeader
        isPlaying={session.phase === "playing"}
        activeTab={quiz.tab}
        showHistory={userId !== null && session.phase !== "playing"}
        onPlay={session.phase === "playing" ? navigation.backToSetup : navigation.showPlayTab}
        onHistory={navigation.showHistoryTab}
      />

      {quiz.tab === "history" && session.phase !== "playing" && (
        <QuizHistoryPanel
          selected={history.selectedHistory}
          answers={history.historyAnswers}
          sessions={history.history}
          loading={history.historyLoading}
          reviewLoading={history.reviewLoading}
          error={history.historyError}
          total={history.historyTotal}
          page={history.historyPage}
          pageSize={history.historyPageSize}
          formatTime={formatClockDuration}
          onBack={() => history.setSelectedHistory(null)}
          onRefresh={() => void history.refreshHistory()}
          onOpenReview={(session) => void history.openHistoryReview(session)}
          onPageSizeChange={history.changeHistoryPageSize}
          onPageChange={history.changeHistoryPage}
        />
      )}

      {quiz.tab === "play" && session.phase === "setup" && (
        <QuizSetupPanel
          mode={configuration.mode}
          onModeChange={configuration.setMode}
          category={configuration.category}
          onCategoryChange={configuration.setCategory}
          categoriesExpanded={configuration.categoriesExpanded}
          onToggleCategories={() => configuration.setCategoriesExpanded((expanded) => !expanded)}
          questionCount={configuration.questionCount}
          onQuestionCountChange={configuration.setQuestionCount}
          maximumQuestions={setup.maximumQuestions}
          meaningQuestions={setup.meaningQuestions}
          typeWordCount={setup.typeWordCount}
          categoryOptions={setup.categoryOptions}
          previewMeaningQuestion={setup.previewMeaningQuestion}
          previewTypeWord={setup.categoryWords.find((word) => Boolean(word.imagePath))}
          onStart={quiz.round.startQuiz}
        />
      )}

      <QuizStickyActions
        showStart={showStickyStart}
        showGameAction={showStickyGameAction}
        canStart={setup.maximumQuestions >= configuration.questionCount}
        mode={configuration.mode}
        input={session.input}
        answer={session.currentAnswer}
        questionIndex={session.questionIndex}
        questionCount={session.questions.length}
        onStart={quiz.round.startQuiz}
        onNext={quiz.round.goToNextQuestion}
      />

      {session.phase === "playing" && session.currentQuestion && (
        <QuizGamePanel
          question={session.currentQuestion}
          mode={configuration.mode}
          questionIndex={session.questionIndex}
          questionCount={session.questions.length}
          startedAt={session.startedAt}
          answer={session.currentAnswer}
          input={session.input}
          elapsedSeconds={session.elapsedSeconds}
          onExit={navigation.backToSetup}
          onInputChange={session.setInput}
          onSubmitAnswer={quiz.round.submitAnswer}
          onNext={quiz.round.goToNextQuestion}
        />
      )}

      {quiz.tab === "play" && session.phase === "results" && (
        <QuizResultsPanel
          questions={session.questions}
          answers={session.answers}
          mode={configuration.mode}
          correctCount={session.correctCount}
          elapsedSeconds={session.elapsedSeconds}
          saveState={quiz.save.saveState}
          saveError={quiz.save.saveError}
          onSetup={navigation.backToSetup}
          onPlayAgain={quiz.round.startQuiz}
          onRetrySave={quiz.save.retrySave}
        />
      )}
    </div>
  );
}
