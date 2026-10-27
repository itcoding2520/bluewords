"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { PronunciationButton } from "@/components/vocabulary/PronunciationButton";
import type { Flashcard } from "@/lib/flashcards/deck";

export function FlashcardWord({
  card,
  showImage,
  children,
}: {
  card: Flashcard;
  showImage: boolean;
  children?: ReactNode;
}) {
  const signedImageUrl = useVocabularyImageUrl(card.word.imagePath);
  const imageUrl = card.word.imageUrl ?? signedImageUrl;

  return (
    <div className="flashcard-word-content flex w-full flex-col items-center justify-center text-center">
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={`Illustration for ${card.word.word}`}
          width={176}
          height={176}
          unoptimized
          className={`flashcard-word-image mb-5 size-36 rounded-2xl border border-slate-100 object-cover sm:size-44 ${showImage ? "" : "hidden sm:block"}`}
        />
      )}
      <div className="flex min-w-0 flex-col items-center">
        <div className="flex items-center gap-2">
          <h2 className="break-words text-2xl font-bold text-slate-950 sm:text-3xl">{card.word.word}</h2>
          <PronunciationButton word={card.word.word} />
        </div>
        {card.word.ipa?.trim() && <p className="mt-2 text-sm text-slate-500">{card.word.ipa.trim()}</p>}
        {children}
      </div>
    </div>
  );
}

export function FlashcardAnswer({ card }: { card: Flashcard }) {
  const detailedMeanings = card.word.detailedMeanings?.filter((meaning) => meaning.meaning.trim()) ?? [];

  return (
    <div className="flex w-full flex-col items-center justify-center text-center">
      <FlashcardWord card={card} showImage={false}>
        {detailedMeanings.length > 0 ? (
          <ul className="mt-5 space-y-3 text-left">
            {detailedMeanings.map((meaning, index) => (
              <li key={meaning.id ?? `${meaning.partOfSpeech}-${index}`} className="flex items-start gap-2 text-slate-600">
                <span className="shrink-0 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium capitalize text-blue-700">{meaning.partOfSpeech}</span>
                <span>{meaning.meaning}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">{card.word.meaning || "No meaning added yet."}</p>
        )}
      </FlashcardWord>
    </div>
  );
}
