import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import type {
  LeaderboardDifficulty,
  LeaderboardGame,
  LeaderboardGridSize,
  LeaderboardQuestionCount,
  LeaderboardQuizMode,
} from "@/hooks/useGamesLeaderboardController";

const selectClassName = "min-h-10 rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-12 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

function LeaderboardSelect(props: ComponentProps<"select">) {
  const { children, className = "", ...selectProps } = props;
  return (
    <span className="relative inline-flex">
      <select {...selectProps} className={`${selectClassName} appearance-none ${className}`}>
        {children}
      </select>
      <ChevronDown size={15} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
    </span>
  );
}

export function GamesLeaderboardControls({
  game,
  quizMode,
  questionCount,
  gridSize,
  difficulty,
  onGameChange,
  onQuizModeChange,
  onQuestionCountChange,
  onGridSizeChange,
  onDifficultyChange,
}: {
  game: LeaderboardGame;
  quizMode: LeaderboardQuizMode;
  questionCount: LeaderboardQuestionCount;
  gridSize: LeaderboardGridSize;
  difficulty: LeaderboardDifficulty;
  onGameChange: (game: LeaderboardGame) => void;
  onQuizModeChange: (mode: LeaderboardQuizMode) => void;
  onQuestionCountChange: (count: LeaderboardQuestionCount) => void;
  onGridSizeChange: (size: LeaderboardGridSize) => void;
  onDifficultyChange: (difficulty: LeaderboardDifficulty) => void;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Choose leaderboard game">
        <button type="button" role="tab" aria-selected={game === "quiz"} onClick={() => onGameChange("quiz")} className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${game === "quiz" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Vocabulary Quiz</button>
        <button type="button" role="tab" aria-selected={game === "word-search"} onClick={() => onGameChange("word-search")} className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${game === "word-search" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Word Search</button>
        <button type="button" role="tab" aria-selected={game === "word-match"} onClick={() => onGameChange("word-match")} className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${game === "word-match" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Word Match</button>
        <button type="button" role="tab" aria-selected={game === "word-scramble"} onClick={() => onGameChange("word-scramble")} className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${game === "word-scramble" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Word Scramble</button>
        <button type="button" role="tab" aria-selected={game === "word-maze"} onClick={() => onGameChange("word-maze")} className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${game === "word-maze" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Word Maze</button>
        <button type="button" role="tab" aria-selected={game === "sentence-builder"} onClick={() => onGameChange("sentence-builder")} className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${game === "sentence-builder" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Sentence Builder</button>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Leaderboard filters">
        {game === "quiz" ? (
          <>
            <label className="sr-only" htmlFor="leaderboard-quiz-mode">Quiz mode</label>
            <LeaderboardSelect id="leaderboard-quiz-mode" value={quizMode} onChange={(event) => onQuizModeChange(event.target.value as LeaderboardQuizMode)}>
              <option value="choose-meaning">Choose the meaning</option><option value="type-word">Type the word</option>
            </LeaderboardSelect>
            <label className="sr-only" htmlFor="leaderboard-question-count">Number of questions</label>
            <LeaderboardSelect id="leaderboard-question-count" value={questionCount} onChange={(event) => onQuestionCountChange(Number(event.target.value) as LeaderboardQuestionCount)}>
              <option value={10}>10 questions</option><option value={20}>20 questions</option><option value={30}>30 questions</option>
            </LeaderboardSelect>
          </>
        ) : game === "word-search" ? (
          <>
            <label className="sr-only" htmlFor="leaderboard-grid-size">Grid size</label>
            <LeaderboardSelect id="leaderboard-grid-size" value={gridSize} onChange={(event) => onGridSizeChange(Number(event.target.value) as LeaderboardGridSize)}>
              <option value={10}>10 × 10 grid</option><option value={15}>15 × 15 grid</option><option value={20}>20 × 20 grid</option>
            </LeaderboardSelect>
            <label className="sr-only" htmlFor="leaderboard-difficulty">Difficulty</label>
            <LeaderboardSelect id="leaderboard-difficulty" value={difficulty} onChange={(event) => onDifficultyChange(event.target.value as LeaderboardDifficulty)}>
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </LeaderboardSelect>
          </>
        ) : null}
      </div>

      <p className="text-xs text-slate-500">
        {game === "quiz" ? "Ranked by correct answers, then fastest time." : game === "word-search" ? "Ranked by fastest time; ties favor more words found. All categories are included." : "Ranked by score, then fastest time. Showing each player's best result."}
      </p>
    </>
  );
}
