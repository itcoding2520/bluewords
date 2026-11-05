"use client";

import Image from "next/image";

import type { VocabularyWord } from "@/data/vocabulary";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";

export function QuizQuestionImage({ word, className = "" }: { word: VocabularyWord; className?: string }) {
  const imageUrl = useVocabularyImageUrl(word.imagePath);
  if (!imageUrl) return <div className={`grid size-48 place-items-center rounded-2xl bg-slate-100 text-center text-sm text-slate-400 ${className}`}>{word.imagePath ? "Loading image…" : "No image"}</div>;
  return <Image src={imageUrl} alt="Vocabulary quiz prompt" width={200} height={200} unoptimized className={`size-30 rounded-2xl border border-slate-100 object-cover ${className}`} />;
}
