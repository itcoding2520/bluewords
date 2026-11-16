import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { loadSentenceBuilderQuestions } from "@/lib/supabase/sentence-builder";
import type { SentenceBuilderQuestion } from "@/lib/sentence-builder";

export function useAdminSentenceBuilderData() {
  const [questions, setQuestions] = useState<SentenceBuilderQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await loadSentenceBuilderQuestions(false);
      if (mounted.current) setQuestions(result);
    } catch {
      if (mounted.current) toast.error("Could not load Sentence Builder questions.");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => {
      mounted.current = false;
      window.clearTimeout(timer);
    };
  }, [refresh]);

  return { questions, loading, refresh };
}
