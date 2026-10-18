"use client";

import { useEffect, useState } from "react";
import { createVocabularyImageUrl } from "@/lib/supabase/vocabulary-images";

export function useVocabularyImageUrl(path?: string | null) {
  const [result, setResult] = useState<{
    path: string | null;
    url: string | null;
  }>({ path: null, url: null });

  useEffect(() => {
    let cancelled = false;
    if (path) {
      void createVocabularyImageUrl(path).then((signedUrl) => {
        if (!cancelled) setResult({ path, url: signedUrl });
      });
    }

    return () => {
      cancelled = true;
    };
  }, [path]);

  return result.path === (path ?? null) ? result.url : null;
}
