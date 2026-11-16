"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowRight, CaseSensitive, Check, Clock3, Delete, Lightbulb, Sparkles, Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PronunciationButton } from "@/components/vocabulary/PronunciationButton";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import type { LetterTile, ScrambleWord } from "@/hooks/useWordScrambleController";

export function WordScrambleRound({
  currentWord,
  questionIndex,
  questionCount,
  letterTiles,
  answerTileIds,
  usedTileIds,
  score,
  streak,
  timeLabel,
  hintsLeft,
  hintUsed,
  feedback,
  isCorrect,
  onChooseLetter,
  onRemoveLetter,
  onUseHint,
  onNextQuestion,
}: {
  currentWord: ScrambleWord;
  questionIndex: number;
  questionCount: number;
  letterTiles: LetterTile[];
  answerTileIds: number[];
  usedTileIds: Set<number>;
  score: number;
  streak: number;
  timeLabel: string;
  hintsLeft: number;
  hintUsed: boolean;
  feedback: string;
  isCorrect: boolean;
  onChooseLetter: (tileId: number) => void;
  onRemoveLetter: (tileId?: number) => void;
  onUseHint: () => void;
  onNextQuestion: () => void;
}) {
  const lettersByTileId = useMemo(
    () => new Map(letterTiles.map((tile) => [tile.id, tile.letter])),
    [letterTiles],
  );

  return (
    <Card className="word-scramble-game-card">
      <div className="word-scramble-topline">
        <div className="word-scramble-level"><div><strong>Level {questionIndex + 1} of {questionCount}</strong><span>{questionIndex + 1} / {questionCount}</span></div><i><b style={{ width: `${((questionIndex + 1) / questionCount) * 100}%` }} /></i></div>
        <div className="word-scramble-stat"><Star size={30} fill="currentColor" /><span><small>Score</small><strong>{score}</strong></span></div>
        <div className="word-scramble-stat word-scramble-streak"><span className="word-scramble-flame">♨</span><span><small>Streak</small><strong>{streak}</strong></span></div>
        <div className="word-scramble-stat word-scramble-clock"><Clock3 size={20} /><span><small>Time</small><strong>{timeLabel}</strong></span></div>
      </div>

      <div className="word-scramble-prompt">
        <ScrambleImage key={currentWord.id} word={currentWord} />
        <div className="word-scramble-clues">
          <p className="word-scramble-meaning-clue">{currentWord.meaning}</p>
          <div className="word-scramble-meaning-row"><PronunciationButton word={currentWord.word} /><span>Listen to the word</span><small>{currentWord.category}</small></div>
          <div className="word-scramble-answer" aria-label={`Answer, ${currentWord.answer.length} letters`}>
            {[...currentWord.answer].map((_, index) => {
              const tileId = answerTileIds[index];
              const letter = tileId === undefined ? "" : lettersByTileId.get(tileId) ?? "";
              return <button key={index} type="button" aria-label={letter ? `Remove letter ${letter}` : `Empty letter position ${index + 1}`} disabled={!letter || isCorrect} onClick={() => tileId !== undefined && onRemoveLetter(tileId)} className={`word-scramble-slot ${letter ? "has-letter" : ""} ${isCorrect ? "is-correct" : feedback && !isCorrect ? "is-incorrect" : ""}`}>{letter}</button>;
            })}
          </div>
          <p className={`word-scramble-feedback ${isCorrect ? "is-correct" : feedback ? "is-incorrect" : ""}`} aria-live="polite">{feedback || "Choose the letters in the correct order."}</p>
        </div>
      </div>

      {!isCorrect ? <>
        <div className="word-scramble-letter-bank" aria-label="Available letters">
          {letterTiles.map((tile) => <button key={tile.id} type="button" disabled={usedTileIds.has(tile.id)} onClick={() => onChooseLetter(tile.id)} aria-label={`Choose ${tile.letter}`} className={usedTileIds.has(tile.id) ? "is-used" : ""}>{tile.letter}</button>)}
          <button type="button" className="word-scramble-backspace" aria-label="Remove last letter" disabled={!answerTileIds.length} onClick={() => onRemoveLetter()}><Delete size={24} /></button>
        </div>
        <div className="word-scramble-actions"><button type="button" className="word-scramble-hint" disabled={!hintsLeft} onClick={onUseHint}><Lightbulb size={21} /> Hint <span>{hintsLeft}</span></button><span className="word-scramble-hint-note">Hints place one letter and reduce points.</span></div>
      </> : <div className="word-scramble-correct-actions"><span><Check size={18} /> +{hintUsed ? 10 : 20} points</span><button type="button" className="word-scramble-next" onClick={onNextQuestion}>{questionIndex + 1 === questionCount ? "See results" : "Next question"} <ArrowRight size={21} /></button></div>}
    </Card>
  );
}

function ScrambleImage({ word }: { word: ScrambleWord }) {
  const signedUrl = useVocabularyImageUrl(word.imagePath);
  const url = word.imageUrl ?? signedUrl;
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(url) && !imageFailed;

  return (
    <div className="word-scramble-picture">
      {showImage ? <Image src={url!} alt={`Picture hint for ${word.word}`} fill unoptimized onError={() => setImageFailed(true)} sizes="(max-width: 700px) 90vw, 28rem" /> : <div className="word-scramble-picture-placeholder" aria-hidden="true"><CaseSensitive size={64} /><Sparkles size={20} /></div>}
    </div>
  );
}
