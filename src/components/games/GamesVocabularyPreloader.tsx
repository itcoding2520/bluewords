"use client";

import { useEffect } from "react";
import { useVocabulary } from "@/contexts/VocabularyContext";

export function GamesVocabularyPreloader() {
  const { isLoaded, refreshWords } = useVocabulary({ loadWords: false });

  useEffect(() => {
    if (isLoaded) return;

    let started = false;
    const handleIntent = (event: Event) => {
      if (started || !(event.target instanceof Element)) return;

      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;

      const path = anchor.pathname;
      if (!(path.startsWith("/games/") || path === "/quiz")) return;

      started = true;
      window.removeEventListener("pointerover", handleIntent, true);
      window.removeEventListener("pointerdown", handleIntent, true);
      window.removeEventListener("focusin", handleIntent, true);
      void refreshWords();
    };

    window.addEventListener("pointerover", handleIntent, true);
    window.addEventListener("pointerdown", handleIntent, true);
    window.addEventListener("focusin", handleIntent, true);

    return () => {
      window.removeEventListener("pointerover", handleIntent, true);
      window.removeEventListener("pointerdown", handleIntent, true);
      window.removeEventListener("focusin", handleIntent, true);
    };
  }, [isLoaded, refreshWords]);

  return null;
}
