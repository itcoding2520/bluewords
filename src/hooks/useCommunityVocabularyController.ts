import { useEffect, useMemo, useState } from "react";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { loadPublishedCommunityVocabulary, type CommunityWord } from "@/lib/supabase/community-vocabulary";
import {
  filterCommunityVocabularyWords,
  getCommunityVocabularyCategories,
  getCommunityVocabularyFallbackImages,
} from "@/lib/vocabulary/community-vocabulary-view";
import { scheduleDeferredTask } from "@/lib/schedule-deferred-task";

export function useCommunityVocabularyController() {
  const supabase = useSupabaseClient();
  const [words, setWords] = useState<CommunityWord[]>([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const cancelScheduledLoad = scheduleDeferredTask(() => {
      void loadPublishedCommunityVocabulary(supabase)
        .then((loadedWords) => {
          if (active) {
            setWords(loadedWords);
            setLoaded(true);
          }
        });
    });
    return () => { active = false; cancelScheduledLoad(); };
  }, [supabase]);

  const categories = useMemo(() => getCommunityVocabularyCategories(words), [words]);
  const visibleWords = useMemo(
    () => filterCommunityVocabularyWords(words, category, search),
    [category, search, words]
  );
  const fallbackWordImages = useMemo(
    () => getCommunityVocabularyFallbackImages(visibleWords),
    [visibleWords]
  );

  return {
    data: { words, loaded, categories, visibleWords, fallbackWordImages },
    filters: { category, setCategory, search, setSearch },
  };
}
