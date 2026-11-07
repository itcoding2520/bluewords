"use client";

import { QuizGamePanel } from "@/components/quiz/QuizGamePanel";
import { QuizHistoryPanel } from "@/components/quiz/QuizHistoryPanel";
import { QuizPageHeader } from "@/components/quiz/QuizPageHeader";
import { QuizResultsPanel } from "@/components/quiz/QuizResultsPanel";
import { QuizSetupPanel } from "@/components/quiz/QuizSetupPanel";
import { QuizStickyActions } from "@/components/quiz/QuizStickyActions";
import { useQuizExperience } from "@/hooks/useQuizExperience";
import { formatQuizTime } from "@/lib/quiz-model";

export function QuizGameContent({ userId }: { userId: string | null }) {
  const quiz = useQuizExperience(userId);
  const { configuration, setup, history, navigation } = quiz;
  const showStickyStart = quiz.tab === "play" && quiz.phase === "setup";
  const showStickyGameAction = quiz.tab === "play"
    && quiz.phase === "playing"
    && Boolean(quiz.currentQuestion)
    && (configuration.mode === "type-word" || Boolean(quiz.currentAnswer));

  if (!quiz.isLoaded) return <p className="py-16 text-sm text-slate-500">Loading quiz vocabulary…</p>;

  return (
    <div className={`quiz-page ${showStickyStart || showStickyGameAction ? "pb-24 sm:pb-0" : ""}`}>
      <QuizPageHeader
        isPlaying={quiz.phase === "playing"}
        activeTab={quiz.tab}
        showHistory={userId !== null && quiz.phase !== "playing"}
        onPlay={quiz.phase === "playing" ? navigation.backToSetup : navigation.showPlayTab}
        onHistory={navigation.showHistoryTab}
      />

      {quiz.tab === "history" && quiz.phase !== "playing" && (
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
          formatTime={formatQuizTime}
          onBack={() => history.setSelectedHistory(null)}
          onRefresh={() => void history.refreshHistory()}
          onOpenReview={(session) => void history.openHistoryReview(session)}
          onPageSizeChange={history.changeHistoryPageSize}
          onPageChange={history.changeHistoryPage}
        />
      )}

      {quiz.tab === "play" && quiz.phase === "setup" && (
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
        input={quiz.input}
        answer={quiz.currentAnswer}
        questionIndex={quiz.questionIndex}
        questionCount={quiz.questions.length}
        onStart={quiz.round.startQuiz}
        onNext={quiz.round.goToNextQuestion}
      />

      {quiz.phase === "playing" && quiz.currentQuestion && (
        <QuizGamePanel
          question={quiz.currentQuestion}
          mode={configuration.mode}
          questionIndex={quiz.questionIndex}
          questionCount={quiz.questions.length}
          answer={quiz.currentAnswer}
          input={quiz.input}
          elapsedSeconds={quiz.elapsedSeconds}
          onExit={navigation.backToSetup}
          onInputChange={quiz.setInput}
          onSubmitAnswer={quiz.round.submitAnswer}
          onNext={quiz.round.goToNextQuestion}
        />
      )}

      {quiz.tab === "play" && quiz.phase === "results" && (
        <QuizResultsPanel
          questions={quiz.questions}
          answers={quiz.answers}
          mode={configuration.mode}
          correctCount={quiz.correctCount}
          elapsedSeconds={quiz.elapsedSeconds}
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
