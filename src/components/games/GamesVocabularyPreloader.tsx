"use client";

import { useVocabulary } from "@/contexts/VocabularyContext";

export function GamesVocabularyPreloader() {
  useVocabulary();
  return null;
}
