"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const VocabularyProvider = dynamic(
  () => import("@/contexts/VocabularyContext").then((module) => module.VocabularyProvider),
  {
    loading: () => (
      <div className="min-h-48 animate-pulse rounded-2xl bg-white/60" aria-label="Loading vocabulary" />
    ),
  },
);

const vocabularyRoutes = [
  "/vocabulary",
  "/flashcards",
  "/quiz",
  "/games/word-match",
  "/games/word-maze",
  "/games/word-scramble",
  "/games/word-search",
  "/publish",
];

export function RouteVocabularyProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const needsVocabulary = vocabularyRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  return needsVocabulary ? (
    <VocabularyProvider>{children}</VocabularyProvider>
  ) : (
    children
  );
}
