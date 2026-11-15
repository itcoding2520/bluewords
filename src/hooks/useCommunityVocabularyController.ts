import { useEffect, useMemo, useState } from "react";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { createVocabularySearchMatcher } from "@/lib/vocabulary/search";

type CommunityWord = {
  id: string;
  word: string;
  meaning: string;
  ipa: string | null;
  image_path: string | null;
  community_categories: { name: string; image_path: string | null; color: string };
};

export function useCommunityVocabularyController() {
  const supabase = useSupabaseClient();
  const [words, setWords] = useState<CommunityWord[]>([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void supabase.from("community_words")
        .select("id, word, meaning, ipa, image_path, community_categories!inner(name, status, image_path, color)")
        .eq("status", "published")
        .eq("community_categories.status", "published")
        .order("word")
        .then(({ data }) => {
          if (active) {
            setWords((data ?? []) as unknown as CommunityWord[]);
            setLoaded(true);
          }
        });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [supabase]);

  const categories = useMemo(() => [...new Set(words.map((item) => item.community_categories.name))].sort((a, b) => a.localeCompare(b)), [words]);
  const visibleWords = useMemo(() => {
    const matchesSearch = createVocabularySearchMatcher(search);
    return words.filter((item) =>
      (category === "all" || item.community_categories.name === category)
      && matchesSearch(item.word, item.meaning)
    );
  }, [category, search, words]);
  const fallbackWordImages = useMemo(() => {
    const images = new Map<string, string>();
    for (const item of visibleWords) {
      if (item.image_path && !images.has(item.community_categories.name)) {
        images.set(item.community_categories.name, item.image_path);
      }
    }
    return images;
  }, [visibleWords]);

  return { words, category, setCategory, search, setSearch, loaded, categories, visibleWords, fallbackWordImages };
}
