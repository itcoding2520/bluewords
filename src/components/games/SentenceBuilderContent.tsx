"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, Lightbulb, RotateCcw, Sparkles, Star, Trophy, Undo2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { CategoryDropdown } from "@/components/vocabulary/VocabularyCategoryDropdown";
import Image from "next/image";
import { sentenceBuilderQuestionCounts, useSentenceBuilderController } from "@/hooks/useSentenceBuilderController";
import type { SentenceDifficulty } from "@/lib/sentence-builder";

const icons: Record<string, string> = { apple: "🍎", banana: "🍌", cat: "🐱", dog: "🐶", book: "📚", sun: "☀️", water: "💧", milk: "🥛", ball: "⚽", girl: "👧", boy: "👦", school: "🏫", flower: "🌸", bird: "🐦", fish: "🐟", car: "🚗", tree: "🌳" };
function SentencePicture({ keyword, questionId }: { keyword: string; questionId: string }) {
  const { words } = useVocabulary();
  const word = words.find((item) => item.word.toLocaleLowerCase() === keyword.toLocaleLowerCase());
  const imageUrl = useVocabularyImageUrl(word?.imagePath ?? null);
  const [failed, setFailed] = useState(false);
  return <div className="sentence-builder-picture">{imageUrl && !failed ? <Image key={questionId} src={imageUrl} alt={`Picture clue: ${keyword}`} fill unoptimized sizes="(max-width: 700px) 90vw, 28rem" onError={() => setFailed(true)} /> : <span aria-label={keyword}>{icons[keyword.toLowerCase()] ?? "🖼️"}</span>}</div>;
}

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
    {phase === "setup" ? <div className="sentence-builder-setup">
      <Card className="sentence-builder-panel"><div className="sentence-builder-panel-title"><span>🧩</span><div><h2>Build a sentence</h2><p>Use the picture and Vietnamese clue to arrange the word tiles.</p></div></div>
        <label htmlFor="sentence-builder-difficulty">Difficulty</label><select id="sentence-builder-difficulty" className="sentence-builder-difficulty-select" value={difficulty} onChange={(e) => { setDifficulty(e.target.value as SentenceDifficulty); setCategory("all"); }}><option value="easy">Easy · Dễ</option><option value="medium">Medium · Trung bình</option><option value="hard">Hard · Khó</option></select>
        <label className="sentence-builder-category-label" htmlFor="sentence-builder-category">Category</label><CategoryDropdown id="sentence-builder-category" ariaLabel="Sentence category" category={category} categories={categories} words={words} onChange={setCategory} includeAll fullWidth />
        <fieldset><legend>Questions per round</legend><div className="sentence-builder-counts">{sentenceBuilderQuestionCounts.map((count) => <button key={count} type="button" aria-pressed={count === questionCount} disabled={eligible.length < count} className={count === questionCount ? "is-selected" : ""} onClick={() => setQuestionCount(count)}>{count} questions</button>)}</div></fieldset>
        <p className="sentence-builder-availability">{eligible.length} questions available at this level.</p>
        {eligible.length < 5 && <p className="sentence-builder-empty">There are not enough active questions here yet. Try another level or category.</p>}
        <button className="sentence-builder-primary" type="button" disabled={eligible.length < questionCount} onClick={start}><Sparkles size={19}/> Start game <ArrowRight size={19}/></button>
      </Card><Card className="sentence-builder-howto"><span>💡</span><h2>How to play</h2><p>Tap each word tile in sentence order, then check your sentence. Correct answers earn 10 points. Hints reveal one word.</p><strong><Star size={17} fill="currentColor"/> 10 points per correct sentence</strong></Card>
    </div> : phase === "playing" && current ? <Card className="sentence-builder-game">
      <div className="sentence-builder-stats"><button type="button" onClick={() => void exit()}><ArrowLeft size={16}/> Exit round</button><span>Question {index + 1} of {round.length}</span><b><Star size={18} fill="currentColor"/> {score} points</b><b><Clock3 size={17}/> {elapsed}</b></div>
      <div className="sentence-builder-progress"><i style={{ width: `${((index + 1) / round.length) * 100}%` }}/></div>
      <div className="sentence-builder-question"><SentencePicture keyword={current.image_keyword} questionId={current.id}/><section><h2>Build the sentence</h2><p className="sentence-builder-clue"><Lightbulb size={20}/> {current.prompt_vi}</p><div className="sentence-builder-answer" aria-label="Your sentence">{chosen.length ? chosen.map((tile) => <button key={tile.id} type="button" disabled={solved} onClick={() => removeTile(tile.id)}>{tile.text}</button>) : <span>Choose word tiles below</span>}</div><div className="sentence-builder-feedback" aria-live="polite">{feedback}</div></section></div>
      <div className="sentence-builder-tiles" aria-label="Available word tiles">{tiles.map((tile) => <button type="button" key={tile.id} disabled={solved || chosen.some((item) => item.id === tile.id)} onClick={() => choose(tile)}>{tile.text}</button>)}</div>
      <div className="sentence-builder-actions"><button type="button" className="sentence-builder-hint" disabled={solved || hints === 0} onClick={useHint}><Lightbulb size={18}/> Hint <small>{hints}</small></button><button type="button" className="sentence-builder-remove" disabled={solved || chosen.length === 0} onClick={removeLastTile}><Undo2 size={18}/> Remove last word</button>{solved ? <button type="button" className="sentence-builder-primary" onClick={nextQuestion}>{index + 1 === round.length ? "Finish round" : "Next sentence"}<ArrowRight size={18}/></button> : <button type="button" className="sentence-builder-primary" disabled={!chosen.length} onClick={submit}><Check size={18}/> Check sentence</button>}</div>
    </Card> : <Card className="sentence-builder-results"><span><Trophy size={38}/></span><p>ROUND COMPLETE</p><h2>Sentence superstar!</h2><strong>{score} <small>points</small></strong><div><span>{correctCount}/{round.length} correct</span><span>{elapsed}</span></div><p className="sentence-builder-save">{isAuthenticated ? saveState : "Sign in to save scores to the leaderboard."}</p><button type="button" className="sentence-builder-primary" onClick={() => setPhase("setup")}><RotateCcw size={18}/> Play again</button></Card>}
  </main>;
}
