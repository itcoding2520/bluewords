"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { ChevronDown, Clock3, Crown, RefreshCw, Trophy } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { UserAvatar } from "@/components/user/UserAvatar";
import {
  getQuizLeaderboard,
  getVocabularyGameLeaderboard,
  getWordSearchLeaderboard,
  type QuizLeaderboardRow,
  type VocabularyGameLeaderboardRow,
  type WordSearchLeaderboardRow,
} from "@/lib/supabase/game-leaderboard";

type GameTab = "quiz" | "word-search" | "word-match" | "word-scramble" | "word-maze" | "sentence-builder";
type QuizMode = "choose-meaning" | "type-word";
type Difficulty = "easy" | "medium" | "hard";
type LeaderboardRow = QuizLeaderboardRow | WordSearchLeaderboardRow | VocabularyGameLeaderboardRow;

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const selectClassName = "min-h-10 rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-12 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

function LeaderboardSelect(props: ComponentProps<"select">) {
  const { children, className = "", ...selectProps } = props;

  return (
    <span className="relative inline-flex">
      <select {...selectProps} className={`${selectClassName} appearance-none ${className}`}>
        {children}
      </select>
      <ChevronDown
        size={15}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </span>
  );
}

export function GamesLeaderboard() {
  const [game, setGame] = useState<GameTab>("quiz");
  const [quizMode, setQuizMode] = useState<QuizMode>("choose-meaning");
  const [questionCount, setQuestionCount] = useState<10 | 20 | 30>(10);
  const [gridSize, setGridSize] = useState<10 | 15 | 20>(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    const request = game === "quiz"
      ? getQuizLeaderboard({ mode: quizMode, questionCount })
      : game === "word-search"
        ? getWordSearchLeaderboard({ gridSize, difficulty })
        : getVocabularyGameLeaderboard({ gameType: game, roundSize: null });

    void request.then((result) => {
      if (active) setRows(result);
    }).catch(() => {
      if (active) {
        setRows([]);
        setError("Could not load the leaderboard. Please try again.");
      }
    }).finally(() => {
      if (active) {
        setLoading(false);
        setRefreshing(false);
      }
    });

    return () => { active = false; };
  }, [game, quizMode, questionCount, gridSize, difficulty, reloadKey]);

  function refresh() {
    setLoading(true);
    setError("");
    setRefreshing(true);
    setReloadKey((key) => key + 1);
  }

  return (
    <section className="games-leaderboard" aria-labelledby="game-leaderboard-title">
      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-yellow-100 text-amber-500"><Trophy size={21} /></span>
            <div>
              <h2 id="game-leaderboard-title" className="text-lg font-semibold text-slate-950">Game leaderboard</h2>
              <p className="mt-1 text-sm text-slate-500">Best result per player · top 50 plus your rank · anonymous names</p>
            </div>
          </div>
          <button type="button" onClick={refresh} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-700 disabled:opacity-50">
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Choose leaderboard game">
            <button type="button" role="tab" aria-selected={game === "quiz"} onClick={() => { if (game !== "quiz") { setLoading(true); setError(""); setGame("quiz"); } }} className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${game === "quiz" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Vocabulary Quiz</button>
            <button type="button" role="tab" aria-selected={game === "word-search"} onClick={() => { if (game !== "word-search") { setLoading(true); setError(""); setGame("word-search"); } }} className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${game === "word-search" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Word Search</button>
            <button type="button" role="tab" aria-selected={game === "word-match"} onClick={() => { if (game !== "word-match") { setLoading(true); setError(""); setGame("word-match"); } }} className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${game === "word-match" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Word Match</button>
            <button type="button" role="tab" aria-selected={game === "word-scramble"} onClick={() => { if (game !== "word-scramble") { setLoading(true); setError(""); setGame("word-scramble"); } }} className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${game === "word-scramble" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Word Scramble</button>
            <button type="button" role="tab" aria-selected={game === "word-maze"} onClick={() => { if (game !== "word-maze") { setLoading(true); setError(""); setGame("word-maze"); } }} className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${game === "word-maze" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Word Maze</button>
            <button type="button" role="tab" aria-selected={game === "sentence-builder"} onClick={() => { if (game !== "sentence-builder") { setLoading(true); setError(""); setGame("sentence-builder"); } }} className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${game === "sentence-builder" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Sentence Builder</button>
          </div>

          <div className="flex flex-wrap gap-2" aria-label="Leaderboard filters">
            {game === "quiz" ? <>
              <label className="sr-only" htmlFor="leaderboard-quiz-mode">Quiz mode</label>
              <LeaderboardSelect id="leaderboard-quiz-mode" value={quizMode} onChange={(event) => { setLoading(true); setError(""); setQuizMode(event.target.value as QuizMode); }}>
                <option value="choose-meaning">Choose the meaning</option>
                <option value="type-word">Type the word</option>
              </LeaderboardSelect>
              <label className="sr-only" htmlFor="leaderboard-question-count">Number of questions</label>
              <LeaderboardSelect id="leaderboard-question-count" value={questionCount} onChange={(event) => { setLoading(true); setError(""); setQuestionCount(Number(event.target.value) as 10 | 20 | 30); }}>
                <option value={10}>10 questions</option><option value={20}>20 questions</option><option value={30}>30 questions</option>
              </LeaderboardSelect>
            </> : game === "word-search" ? <>
              <label className="sr-only" htmlFor="leaderboard-grid-size">Grid size</label>
              <LeaderboardSelect id="leaderboard-grid-size" value={gridSize} onChange={(event) => { setLoading(true); setError(""); setGridSize(Number(event.target.value) as 10 | 15 | 20); }}>
                <option value={10}>10 × 10 grid</option><option value={15}>15 × 15 grid</option><option value={20}>20 × 20 grid</option>
              </LeaderboardSelect>
              <label className="sr-only" htmlFor="leaderboard-difficulty">Difficulty</label>
              <LeaderboardSelect id="leaderboard-difficulty" value={difficulty} onChange={(event) => { setLoading(true); setError(""); setDifficulty(event.target.value as Difficulty); }}>
                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </LeaderboardSelect>
            </> : null}
          </div>

          <p className="text-xs text-slate-500">
            {game === "quiz" ? "Ranked by correct answers, then fastest time." : game === "word-search" ? "Ranked by fastest time; ties favor more words found. All categories are included." : "Ranked by score, then fastest time. Showing each player's best result."}
          </p>

          {error ? <AutoDismissMessage key={error} variant="error">{error}</AutoDismissMessage>
            : loading ? <div className="py-10 text-center text-sm text-slate-500" role="status">Loading leaderboard…</div>
              : rows.length === 0 ? <div className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">No completed games yet. Be the first on the board!</div>
                : <ol className="space-y-2" aria-label={`${game} rankings`}>
                  {rows.map((row) => {
                    const resultLabel = "correct_count" in row
                      ? "question_count" in row
                        ? `${row.correct_count}/${row.question_count} correct`
                        : `${row.score} points`
                      : `${row.word_count} words · ${row.category}`;
                    return <li key={`${row.rank_position}-${row.player_name}`} className={`games-rank-${row.rank_position} flex min-h-16 items-center gap-3 rounded-xl border px-3 py-3 sm:px-4 ${row.is_you ? "border-blue-200 bg-blue-50/70" : "border-slate-100"}`}>
                      <span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${row.rank_position === 1 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{row.rank_position}</span>
                      <UserAvatar nickname={row.player_name} fallbackName={row.player_name} avatarPath={row.avatar_path} sizeClassName="size-10 text-xs" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">{row.is_you ? "You" : row.player_name}{row.rank_position === 1 ? " 🏆" : ""}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">{resultLabel}</span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold tabular-nums text-slate-700"><Clock3 size={15} className="text-slate-400" />{formatTime(row.duration_seconds)}</span>
                      {row.rank_position <= 3 && <Crown size={27} className="games-rank-crown" aria-label={`Rank ${row.rank_position}`} />}
                    </li>;
                  })}
                </ol>}
        </div>
      </Card>
    </section>
  );
}
