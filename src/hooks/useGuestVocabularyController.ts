import { useMemo, useState } from "react";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { getPageCount, getPageItems } from "@/lib/pagination";
import { getFirstVocabularyCategoriesByName } from "@/lib/vocabulary/category-index";
import { createVocabularySearchMatcher } from "@/lib/vocabulary/search";
import { matchesVocabularyCategory } from "@/lib/vocabulary/category-filter";

export const GUEST_VOCABULARY_PAGE_SIZE = 20;

export function useGuestVocabularyController() {
  const { words, categories, isLoaded } = useVocabulary();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  const filteredWords = useMemo(() => {
    const matchesSearch = createVocabularySearchMatcher(search);
    return words.filter((word) => {
      const matchesCategory = matchesVocabularyCategory(word.category, category);
      const matchesQuery = matchesSearch(word.word, word.meaning);
      return matchesCategory && matchesQuery;
    });
  }, [category, search, words]);
  const pageCount = getPageCount(filteredWords.length, GUEST_VOCABULARY_PAGE_SIZE);
  const pageWords = getPageItems(filteredWords, page, GUEST_VOCABULARY_PAGE_SIZE);
  const categoriesByName = useMemo(() => getFirstVocabularyCategoriesByName(categories), [categories]);

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function changeCategory(value: string) {
    setCategory(value);
    setPage(1);
  }

  function categoryColor(name: string) {
    return categoriesByName.get(name)?.color ?? "blue";
  }

  return {
    data: { words, categories, isLoaded, filteredWords, pageWords, categoryColor },
    filters: { search, category, changeSearch, changeCategory },
    pagination: { page, setPage, pageCount },
  };
}
