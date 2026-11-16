"use client";

import { useCommunityVocabularyController } from "@/hooks/useCommunityVocabularyController";
import { CommunityVocabularyFilters } from "@/components/vocabulary/CommunityVocabularyFilters";
import { CommunityVocabularyHeader } from "@/components/vocabulary/CommunityVocabularyHeader";
import { CommunityVocabularyWordList } from "@/components/vocabulary/CommunityVocabularyWordList";

export function CommunityVocabulary() {
  const {
    data: { words, loaded, categories, visibleWords, fallbackWordImages },
    filters: { category, setCategory, search, setSearch },
  } = useCommunityVocabularyController();

  if (loaded && words.length === 0) return null;

  return <section className="community-vocabulary-section mt-5 rounded-[1.75rem] border border-violet-100 bg-gradient-to-br from-violet-50/90 via-white to-indigo-50/80 p-5 shadow-[0_10px_28px_rgb(78_55_180/0.07)] sm:p-6">
    <CommunityVocabularyHeader count={words.length} />
    <CommunityVocabularyFilters
      categories={categories}
      category={category}
      onCategoryChange={setCategory}
      search={search}
      onSearchChange={setSearch}
    />
    <CommunityVocabularyWordList loaded={loaded} visibleWords={visibleWords} fallbackWordImages={fallbackWordImages} />
  </section>;
}
