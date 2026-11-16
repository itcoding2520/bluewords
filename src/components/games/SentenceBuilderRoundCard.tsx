"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, Clock3, Lightbulb, Star, Undo2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import type { SentenceBuilderQuestion, SentenceBuilderTile } from "@/lib/sentence-builder";

const icons: Record<string, string> = { apple: "🍎", banana: "🍌", cat: "🐱", dog: "🐶", book: "📚", sun: "☀️", water: "💧", milk: "🥛", ball: "⚽", girl: "👧", boy: "👦", school: "🏫", flower: "🌸", bird: "🐦", fish: "🐟", car: "🚗", tree: "🌳" };

function SentencePicture({ keyword, questionId }: { keyword: string; questionId: string }) {
  const { words } = useVocabulary();
  const word = useMemo(
    () => words.find((item) => item.word.toLocaleLowerCase() === keyword.toLocaleLowerCase()),
    [words, keyword],
  );
  const imageUrl = useVocabularyImageUrl(word?.imagePath ?? null);
  const [failed, setFailed] = useState(false);

  return (
    <div className="sentence-builder-picture">
      {imageUrl && !failed ? (
        <Image key={questionId} src={imageUrl} alt={`Picture clue: ${keyword}`} fill unoptimized sizes="(max-width: 700px) 90vw, 28rem" onError={() => setFailed(true)} />
      ) : (
        <span aria-label={keyword}>{icons[keyword.toLowerCase()] ?? "🖼️"}</span>
      )}
    </div>
  );
}

export function SentenceBuilderRoundCard({
  question,
  index,
  roundLength,
  tiles,
  chosen,
  score,
  elapsed,
  hints,
  feedback,
  solved,
  onExit,
  onRemoveTile,
  onChoose,
  onRemoveLastTile,
  onUseHint,
  onNextQuestion,
  onSubmit,
}: {
  question: SentenceBuilderQuestion;
  index: number;
  roundLength: number;
  tiles: SentenceBuilderTile[];
  chosen: SentenceBuilderTile[];
  score: number;
  elapsed: string;
  hints: number;
  feedback: string;
  solved: boolean;
  onExit: () => void;
  onRemoveTile: (tileId: number) => void;
  onChoose: (tile: SentenceBuilderTile) => void;
  onRemoveLastTile: () => void;
  onUseHint: () => void;
  onNextQuestion: () => void;
  onSubmit: () => void;
}) {
  return (
    <Card className="sentence-builder-game">
      <div className="sentence-builder-stats">
        <button type="button" onClick={onExit}><ArrowLeft size={16}/> Exit round</button>
        <span>Question {index + 1} of {roundLength}</span>
        <b><Star size={18} fill="currentColor"/> {score} points</b>
        <b><Clock3 size={17}/> {elapsed}</b>
      </div>
      <div className="sentence-builder-progress"><i style={{ width: `${((index + 1) / roundLength) * 100}%` }}/></div>
      <div className="sentence-builder-question">
        <SentencePicture keyword={question.image_keyword} questionId={question.id}/>
        <section>
          <h2>Build the sentence</h2>
          <p className="sentence-builder-clue"><Lightbulb size={20}/> {question.prompt_vi}</p>
          <div className="sentence-builder-answer" aria-label="Your sentence">
            {chosen.length ? chosen.map((tile) => <button key={tile.id} type="button" disabled={solved} onClick={() => onRemoveTile(tile.id)}>{tile.text}</button>) : <span>Choose word tiles below</span>}
          </div>
          <div className="sentence-builder-feedback" aria-live="polite">{feedback}</div>
        </section>
      </div>
      <div className="sentence-builder-tiles" aria-label="Available word tiles">
        {tiles.map((tile) => <button type="button" key={tile.id} disabled={solved || chosen.some((item) => item.id === tile.id)} onClick={() => onChoose(tile)}>{tile.text}</button>)}
      </div>
      <div className="sentence-builder-actions">
        <button type="button" className="sentence-builder-hint" disabled={solved || hints === 0} onClick={onUseHint}><Lightbulb size={18}/> Hint <small>{hints}</small></button>
        <button type="button" className="sentence-builder-remove" disabled={solved || chosen.length === 0} onClick={onRemoveLastTile}><Undo2 size={18}/> Remove last word</button>
        {solved ? (
          <button type="button" className="sentence-builder-primary" onClick={onNextQuestion}>{index + 1 === roundLength ? "Finish round" : "Next sentence"}<ArrowRight size={18}/></button>
        ) : (
          <button type="button" className="sentence-builder-primary" disabled={!chosen.length} onClick={onSubmit}><Check size={18}/> Check sentence</button>
        )}
      </div>
    </Card>
  );
}
