import { useMemo, useState } from "react";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { getPageCount } from "@/lib/pagination";

export const GUEST_VOCABULARY_PAGE_SIZE = 20;

export function useGuestVocabularyController() {
  const { words, categories, isLoaded } = useVocabulary();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  const filteredWords = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return words.filter((word) => {
      const matchesCategory = category === "all" || word.category === category;
      const matchesQuery = !query || `${word.word} ${word.meaning}`.toLocaleLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [category, search, words]);
  const pageCount = getPageCount(filteredWords.length, GUEST_VOCABULARY_PAGE_SIZE);
  const pageWords = filteredWords.slice((page - 1) * GUEST_VOCABULARY_PAGE_SIZE, page * GUEST_VOCABULARY_PAGE_SIZE);
  const categoryColors = useMemo(() => {
    const colors = new Map<string, (typeof categories)[number]["color"]>();
    for (const item of categories) {
      if (!colors.has(item.name)) colors.set(item.name, item.color);
    }
    return colors;
  }, [categories]);

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function changeCategory(value: string) {
    setCategory(value);
    setPage(1);
  }

  function categoryColor(name: string) {
    return categoryColors.get(name) ?? "blue";
  }

  return {
    words, categories, isLoaded, search, category, page, setPage,
    filteredWords, pageCount, pageWords, categoryColor, changeSearch, changeCategory,
  };
}
