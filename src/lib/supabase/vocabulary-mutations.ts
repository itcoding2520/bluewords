import type {
  VocabularyMeaningRow,
  VocabularyWordRow,
  VocabularyWordUpdate,
} from "@/types/database";
import type { VocabularyType } from "@/config/vocabulary";
import { vocabularySupabase } from "@/lib/supabase/vocabulary-client";

type VocabularyWordInput = Pick<
  VocabularyWordRow,
  "word" | "meaning" | "category" | "status"
> &
  Partial<Pick<VocabularyWordRow, "image_path" | "ipa">> & {
    type?: VocabularyType;
  };

export async function addVocabularyWord(input: VocabularyWordInput): Promise<VocabularyWordRow> {
  const {
    data: { user },
    error: authError,
  } = await vocabularySupabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be logged in to add words.");
  }

  const { data, error } = await vocabularySupabase
    .from("vocabulary_words")
    .insert({
      user_id: user.id,
      word: input.word.trim(),
      meaning: input.meaning.trim(),
      category: input.category,
      status: input.status,
      ...(input.type ? { type: input.type } : {}),
      ...(input.ipa !== undefined ? { ipa: input.ipa } : {}),
      ...(input.image_path !== undefined ? { image_path: input.image_path } : {}),
    })
    .select()
    .single();

  if (error) throw error;
  return data as VocabularyWordRow;
}

export async function updateVocabularyWord(id: string, updates: VocabularyWordUpdate): Promise<VocabularyWordRow> {
  const { data, error } = await vocabularySupabase
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
  const { data, error } = await vocabularySupabase.rpc(
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
  return data as unknown as { word: VocabularyWordRow; meanings: VocabularyMeaningRow[] };
}

export async function deleteVocabularyWord(id: string): Promise<void> {
  const { error } = await vocabularySupabase
    .from("vocabulary_words")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function deleteVocabularyWords(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];

  const { data, error } = await vocabularySupabase
    .from("vocabulary_words")
    .delete()
    .in("id", [...new Set(ids)])
    .select("id");

  if (error) throw error;
  return (data ?? []).map((row) => row.id as string);
}
