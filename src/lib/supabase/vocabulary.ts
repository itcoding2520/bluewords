import { createClient } from "@/lib/supabase/client";
import type {
  VocabularyMeaningInsert,
  VocabularyMeaningRow,
  VocabularyMeaningUpdate,
  VocabularyWordRow,
  VocabularyWordUpdate,
} from "@/types/database";
import type { VocabularyType } from "@/config/vocabulary";
import { fetchAllPages } from "@/lib/supabase/fetch-all-pages.mjs";

const supabase = createClient();

export type VocabularyWordWithMeaningsRow = VocabularyWordRow & {
  vocabulary_meanings: VocabularyMeaningRow[];
};

export interface VocabularyWordPage {
  rows: VocabularyWordWithMeaningsRow[];
  total: number;
}

type VocabularyWordInput = Pick<
  VocabularyWordRow,
  "word" | "meaning" | "category" | "status"
> &
  Partial<Pick<VocabularyWordRow, "image_path" | "ipa">> & {
    type?: VocabularyType;
  };

export async function getVocabularyWords(): Promise<
  VocabularyWordWithMeaningsRow[]
> {
  return fetchAllPages(async (from, to) => {
    const { data, error } = await supabase
      .from("vocabulary_words")
      .select("*, vocabulary_meanings(*)")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);

    return {
      data: (data ?? []) as unknown as VocabularyWordWithMeaningsRow[],
      error,
    };
  });
}

export async function getVocabularyWordPage(input: {
  page: number;
  pageSize: number;
  search: string;
  category: string | null;
}): Promise<VocabularyWordPage> {
  const { data, error } = await supabase.rpc("get_vocabulary_page", {
    p_page: input.page,
    p_page_size: input.pageSize,
    p_search: input.search.trim() || null,
    p_category: input.category,
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

export async function getVocabularyWordsForCategory(
  category: string
): Promise<VocabularyWordWithMeaningsRow[]> {
  const rows: VocabularyWordWithMeaningsRow[] = [];
  let page = 1;
  while (true) {
    const result = await getVocabularyWordPage({
      page,
      pageSize: 100,
      search: "",
      category,
    });
    rows.push(...result.rows);
    if (rows.length >= result.total || result.rows.length === 0) return rows;
    page++;
  }
}

export async function getVocabularyWordById(
  id: string
): Promise<VocabularyWordRow | null> {
  const { data, error } = await supabase
    .from("vocabulary_words")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as VocabularyWordRow | null;
}

export async function getVocabularyWordImagePaths(
  ids: string[]
): Promise<Array<{ id: string; image_path: string | null }>> {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("vocabulary_words")
    .select("id, image_path")
    .in("id", [...new Set(ids)]);
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; image_path: string | null }>;
}

export async function addVocabularyWord(
  input: VocabularyWordInput
): Promise<VocabularyWordRow> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be logged in to add words.");
  }

  const { data, error } = await supabase
    .from("vocabulary_words")
    .insert({
      user_id: user.id,
      word: input.word.trim(),
      meaning: input.meaning.trim(),
      category: input.category,
      status: input.status,
      ...(input.type ? { type: input.type } : {}),
      ...(input.ipa !== undefined ? { ipa: input.ipa } : {}),
      ...(input.image_path !== undefined
        ? { image_path: input.image_path }
        : {}),
    })
    .select()
    .single();

  if (error) throw error;

  return data as VocabularyWordRow;
}

export async function updateVocabularyWord(
  id: string,
  updates: VocabularyWordUpdate
): Promise<VocabularyWordRow> {
  const { data, error } = await supabase
    .from("vocabulary_words")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as VocabularyWordRow;
}

export async function updateVocabularyWordWithMeanings(input: {
  id: string;
  word: string;
  meaning: string;
  category: string;
  status: VocabularyWordRow["status"];
  type: VocabularyWordRow["type"];
  ipa: string | null;
  image_path: string | null;
  meanings: Array<Pick<VocabularyMeaningRow, "part_of_speech" | "meaning">>;
}): Promise<{ word: VocabularyWordRow; meanings: VocabularyMeaningRow[] }> {
  const { data, error } = await supabase.rpc(
    "update_vocabulary_word_with_meanings",
    {
      p_vocabulary_word_id: input.id,
      p_word: input.word,
      p_meaning: input.meaning,
      p_category: input.category,
      p_status: input.status,
      p_type: input.type,
      p_ipa: input.ipa,
      p_image_path: input.image_path,
      p_meanings: input.meanings,
    }
  );

  if (error) throw error;

  return data as unknown as {
    word: VocabularyWordRow;
    meanings: VocabularyMeaningRow[];
  };
}

export async function deleteVocabularyWord(
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("vocabulary_words")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function deleteVocabularyWords(
  ids: string[]
): Promise<string[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("vocabulary_words")
    .delete()
    .in("id", [...new Set(ids)])
    .select("id");

  if (error) throw error;

  return (data ?? []).map((row) => row.id as string);
}

export async function getVocabularyMeanings(
  vocabularyWordId: string
): Promise<VocabularyMeaningRow[]> {
  const { data, error } = await supabase
    .from("vocabulary_meanings")
    .select("*")
    .eq("vocabulary_word_id", vocabularyWordId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []) as VocabularyMeaningRow[];
}

export async function addVocabularyMeaning(
  input: VocabularyMeaningInsert
): Promise<VocabularyMeaningRow> {
  const { data, error } = await supabase
    .from("vocabulary_meanings")
    .insert({
      vocabulary_word_id: input.vocabulary_word_id,
      part_of_speech: input.part_of_speech,
      meaning: input.meaning.trim(),
    })
    .select()
    .single();

  if (error) throw error;

  return data as VocabularyMeaningRow;
}

export async function updateVocabularyMeaning(
  id: string,
  updates: VocabularyMeaningUpdate
): Promise<VocabularyMeaningRow> {
  const normalizedUpdates = {
    ...updates,
    ...(updates.meaning !== undefined
      ? { meaning: updates.meaning.trim() }
      : {}),
  };

  const { data, error } = await supabase
    .from("vocabulary_meanings")
    .update(normalizedUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as VocabularyMeaningRow;
}

export async function deleteVocabularyMeaning(
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("vocabulary_meanings")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
