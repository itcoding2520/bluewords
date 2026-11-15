"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import type { MatchCardData, MatchPair } from "@/hooks/useWordMatchController";

export function WordMatchCard({
  card,
  pair,
  isRevealed,
  isMatched,
  isWrong,
  locked,
  onClick,
}: {
  card: MatchCardData;
  pair: MatchPair;
  isRevealed: boolean;
  isMatched: boolean;
  isWrong: boolean;
  locked: boolean;
  onClick: () => void;
}) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const signedImageUrl = useVocabularyImageUrl(pair.imagePath);
  const imageUrl = pair.imageUrl ?? signedImageUrl;
  const isImage = card.kind === "match" && Boolean(imageUrl) && imageUrl !== failedImageUrl;
  const label = card.kind === "word" ? pair.word : isImage ? `Picture matching ${pair.word}` : pair.meaning;

  return (
    <button
      type="button"
      aria-label={isRevealed || isMatched ? label : "Reveal a matching card"}
      aria-pressed={isRevealed || isMatched}
      disabled={isMatched || locked}
      onClick={onClick}
      className={`word-match-flip-card ${isRevealed || isMatched ? "is-revealed" : ""} ${isMatched ? "is-matched" : ""} ${isWrong ? "is-wrong" : ""}`}
    >
      <span className="word-match-flip-inner">
        <span className="word-match-card-back" aria-hidden={isRevealed || isMatched}>
          <span className="word-match-card-question">?</span>
          <Sparkles size={18} className="word-match-card-sparkle" aria-hidden="true" />
        </span>
        <span className="word-match-card-front" aria-hidden={!isRevealed && !isMatched}>
          {isImage ? <Image src={imageUrl!} alt="" width={112} height={112} unoptimized onError={() => setFailedImageUrl(imageUrl!)} className="word-match-card-image" /> : <span className={card.kind === "word" ? "word-match-card-word" : "word-match-card-meaning"}>{card.kind === "word" ? pair.word : pair.meaning}</span>}
          {isMatched && <span className="word-match-card-check"><Check size={17} aria-hidden="true" /></span>}
        </span>
      </span>
    </button>
  );
}
