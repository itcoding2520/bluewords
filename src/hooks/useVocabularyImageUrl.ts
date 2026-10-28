"use client";

import { useEffect, useState } from "react";
import {
  createVocabularyImageUrl,
  getCachedVocabularyImageUrl,
} from "@/lib/supabase/vocabulary-images";

export function useVocabularyImageUrl(path?: string | null, enabled = true) {
  const [result, setResult] = useState<{
    path: string | null;
    url: string | null;
  }>(() => ({
    path: path ?? null,
    url: path ? getCachedVocabularyImageUrl(path) : null,
  }));

  useEffect(() => {
    let cancelled = false;
    if (path && enabled) {
      void createVocabularyImageUrl(path).then((signedUrl) => {
        if (!cancelled) setResult({ path, url: signedUrl });
      });
    }

    return () => {
      cancelled = true;
    };
  }, [enabled, path]);

  return result.path === (path ?? null) ? result.url : null;
}
