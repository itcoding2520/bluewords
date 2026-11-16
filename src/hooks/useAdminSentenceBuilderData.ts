import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { loadSentenceBuilderQuestions } from "@/lib/supabase/sentence-builder";
import { scheduleDeferredTask } from "@/lib/schedule-deferred-task";
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
    const cancelScheduledLoad = scheduleDeferredTask(() => { void refresh(); });
    return () => {
      mounted.current = false;
      cancelScheduledLoad();
    };
  }, [refresh]);

  return { questions, loading, refresh };
}
