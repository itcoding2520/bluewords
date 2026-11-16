import type {
  VocabularyWordRow,
} from "@/types/database";
import type { VocabularyStatus } from "@/data/vocabulary";
import { fetchAllPages } from "@/lib/supabase/fetch-all-pages.mjs";
import { vocabularySupabase } from "@/lib/supabase/vocabulary-client";
import type { VocabularyWordPage, VocabularyWordWithMeaningsRow } from "@/lib/supabase/vocabulary-types";

export async function getVocabularyWords(): Promise<VocabularyWordWithMeaningsRow[]> {
  return fetchAllPages(async (from, to) => {
    const { data, error } = await vocabularySupabase
      .from("vocabulary_words")
      .select("*, vocabulary_meanings(*)")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);

    return {
      data: (data ?? []) as VocabularyWordWithMeaningsRow[],
      error,
    };
  });
}

export async function getVocabularyWordPage(input: {
  page: number;
  pageSize: number;
  search: string;
  category: string | null;
  status?: VocabularyStatus | null;
}): Promise<VocabularyWordPage> {
  const { data, error } = await vocabularySupabase.rpc("get_vocabulary_page", {
    p_page: input.page,
    p_page_size: input.pageSize,
    p_search: input.search.trim() || null,
    p_category: input.category,
    p_status: input.status ?? null,
  });

  if (error) throw error;

  const result = data as { rows?: unknown; total?: unknown } | null;
  return {
    rows: Array.isArray(result?.rows)
      ? result.rows as VocabularyWordWithMeaningsRow[]
      : [],
    total: typeof result?.total === "number" ? result.total : 0,
  };
}

export async function getVocabularyWordsForCategory(category: string): Promise<VocabularyWordWithMeaningsRow[]> {
  const rows: VocabularyWordWithMeaningsRow[] = [];
  let page = 1;
  while (true) {
    const result = await getVocabularyWordPage({
      page,
      pageSize: 100,
      search: "",
      category,
      status: null,
    });
    rows.push(...result.rows);
    if (rows.length >= result.total || result.rows.length === 0) return rows;
    page++;
  }
}

export async function getVocabularyWordById(id: string): Promise<VocabularyWordRow | null> {
  const { data, error } = await vocabularySupabase
    .from("vocabulary_words")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as VocabularyWordRow | null;
}

export async function getVocabularyWordImagePaths(ids: string[]): Promise<Array<{ id: string; image_path: string | null }>> {
  if (!ids.length) return [];
  const { data, error } = await vocabularySupabase
    .from("vocabulary_words")
    .select("id, image_path")
    .in("id", [...new Set(ids)]);
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; image_path: string | null }>;
}
