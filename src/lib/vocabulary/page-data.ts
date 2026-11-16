import type { VocabularyStatus, VocabularyWord } from "@/data/vocabulary";
import { getVocabularyWordPage } from "@/lib/supabase/vocabulary";
import {
  getCachedVocabularyPage,
  setCachedVocabularyPage,
} from "@/lib/supabase/vocabulary-page-cache.mjs";
import { mapVocabularyWordRow } from "@/lib/vocabulary/shared-vocabulary";
import type { PageResult } from "@/lib/pagination";

export type VocabularyPageQuery = {
  page: number;
  pageSize: number;
  search: string;
  category: string | null;
  status: VocabularyStatus | null;
};

export type VocabularyPageResult = PageResult<VocabularyWord>;

export function getInitialCachedVocabularyPage(authVersion: number) {
  return getCachedVocabularyPage<VocabularyPageResult>(authVersion, {
    page: 1,
    pageSize: 10,
    search: "",
    category: null,
    status: null,
  });
}

export async function loadVocabularyPage(
  authVersion: number,
  query: VocabularyPageQuery,
): Promise<VocabularyPageResult> {
  const cachedPage = getCachedVocabularyPage<VocabularyPageResult>(authVersion, query);
  if (cachedPage) return cachedPage;

  const result = await getVocabularyWordPage(query);
  const mappedResult = {
    rows: result.rows.map(mapVocabularyWordRow),
    total: result.total,
  };
  setCachedVocabularyPage(authVersion, query, mappedResult);
  return mappedResult;
}
