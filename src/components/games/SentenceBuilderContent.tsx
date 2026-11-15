"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useSentenceBuilderController } from "@/hooks/useSentenceBuilderController";
import { SentenceBuilderSetup } from "@/components/games/SentenceBuilderSetup";
import { SentenceBuilderRoundCard } from "@/components/games/SentenceBuilderRoundCard";

export function SentenceBuilderContent() {
  const {
    isAuthenticated, words, loading, difficulty, setDifficulty, category, setCategory, questionCount, setQuestionCount,
    phase, setPhase, round, index, tiles, chosen, score, correctCount, hints, feedback, solved,
    saveState, eligible, categories, current, elapsed, start, choose, removeTile, removeLastTile, submit, useHint, nextQuestion, exit,
  } = useSentenceBuilderController();

  if (loading) return <p className="py-16 text-center text-slate-500">Loading Sentence Builder…</p>;
  return <main className="sentence-builder-page">
    <Link href="/games" className="word-scramble-back"><ArrowLeft size={17}/> Back to Games</Link>
    <header className="sentence-builder-hero"><span>Vocabulary game</span><h1>Sentence <b>Builder</b> ✨</h1><p>Put the words in order to make a sentence!</p></header>
    {phase === "setup" ? <SentenceBuilderSetup
      difficulty={difficulty}
      onDifficultyChange={setDifficulty}
      category={category}
      onCategoryChange={setCategory}
      categories={categories}
      words={words}
      questionCount={questionCount}
      onQuestionCountChange={setQuestionCount}
      eligibleCount={eligible.length}
      onStart={start}
    /> : phase === "playing" && current ? <SentenceBuilderRoundCard
      question={current}
      index={index}
      roundLength={round.length}
      tiles={tiles}
      chosen={chosen}
      score={score}
      elapsed={elapsed}
      hints={hints}
      feedback={feedback}
      solved={solved}
      onExit={() => void exit()}
      onRemoveTile={removeTile}
      onChoose={choose}
      onRemoveLastTile={removeLastTile}
      onUseHint={useHint}
      onNextQuestion={nextQuestion}
      onSubmit={submit}
    /> : <Card className="sentence-builder-results"><span><Trophy size={38}/></span><p>ROUND COMPLETE</p><h2>Sentence superstar!</h2><strong>{score} <small>points</small></strong><div><span>{correctCount}/{round.length} correct</span><span>{elapsed}</span></div><p className="sentence-builder-save">{isAuthenticated ? saveState : "Sign in to save scores to the leaderboard."}</p><button type="button" className="sentence-builder-primary" onClick={() => setPhase("setup")}><RotateCcw size={18}/> Play again</button></Card>}
  </main>;
}
