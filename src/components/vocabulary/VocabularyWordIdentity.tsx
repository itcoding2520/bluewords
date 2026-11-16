"use client";

import { useState } from "react";
import Image from "next/image";

import type { VocabularyWord } from "@/data/vocabulary";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { getDetailedVocabularyMeanings } from "@/lib/vocabulary/meaning";
import { PronunciationButton } from "./PronunciationButton";

const WORD_EMOJI: Record<string, string> = {
  football: "⚽", soccer: "⚽", tennis: "🎾", silver: "🪙", elephant: "🐘",
  biscuit: "🍪", suit: "🧥", cheek: "😊", happy: "😊", horse: "🐴",
};

const CATEGORY_EMOJI: Record<string, string> = {
  sports: "🏅", animals: "🐾", food: "🍎", clothes: "👕", colors: "🎨",
  time: "🕒", body: "🙂", fruits: "🍓", actions: "🏃", weather: "🌤️",
};

function VocabularyMeanings({ item }: { item: VocabularyWord }) {
  const detailedMeanings = getDetailedVocabularyMeanings(item);
  const hasPartOfSpeech = detailedMeanings.some(
    (meaning) => typeof meaning.partOfSpeech === "string" && meaning.partOfSpeech.trim()
  );

  if (!detailedMeanings.length) {
    return <p className="break-words">{item.meaning}</p>;
  }

  return (
    <ul aria-label="Detailed meanings" className="space-y-1.5">
      {detailedMeanings.map((meaning, index) => (
        <li
          key={meaning.id ?? `${meaning.partOfSpeech}-${index}`}
          className="break-words text-xs text-slate-500"
        >
          {hasPartOfSpeech && meaning.partOfSpeech && (
            <span className="mr-1.5 inline-flex rounded-md bg-blue-50 px-1.5 py-0.5 font-medium capitalize text-blue-700">
              {meaning.partOfSpeech}
            </span>
          )}
          {meaning.meaning}
        </li>
      ))}
    </ul>
  );
}

export function VocabularyWordIdentity({ item }: { item: VocabularyWord }) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageUrl = useVocabularyImageUrl(item.imagePath);
  const imageFallback = WORD_EMOJI[item.word.toLocaleLowerCase()]
    ?? CATEGORY_EMOJI[item.category.toLocaleLowerCase()]
    ?? "📖";

  return (
    <>
      <div className="col-start-2 row-start-1 flex min-w-0 items-start gap-3 lg:items-center">
        {imageUrl && failedImageUrl !== imageUrl ? (
          <Image
            src={imageUrl}
            alt={`Illustration for ${item.word}`}
            width={48}
            height={48}
            unoptimized
            onError={() => setFailedImageUrl(imageUrl)}
            className="vocabulary-word-thumbnail size-11 shrink-0 rounded-lg border border-slate-100 object-cover"
          />
        ) : (
          <span aria-hidden="true" className="vocabulary-word-fallback">{imageFallback}</span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="break-words font-semibold text-slate-950">{item.word}</p>
            <PronunciationButton word={item.word} />
          </div>
          <span className="mt-1 hidden w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 lg:inline-flex">
            {item.type === "expression" ? "Expression" : "Word"}
          </span>
          <div className="mt-1 lg:hidden">
            <div className="text-sm text-slate-500"><VocabularyMeanings item={item} /></div>
          </div>
        </div>
      </div>

      <div className="hidden min-w-0 text-sm text-slate-500 lg:col-start-3 lg:block">
        <VocabularyMeanings item={item} />
      </div>
    </>
  );
}
