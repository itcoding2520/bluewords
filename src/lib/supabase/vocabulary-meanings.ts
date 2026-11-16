import { createClient } from "@/lib/supabase/client";
import type {
  VocabularyMeaningInsert,
  VocabularyMeaningRow,
  VocabularyMeaningUpdate,
} from "@/types/database";

const supabase = createClient();

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
    ...(updates.meaning !== undefined ? { meaning: updates.meaning.trim() } : {}),
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

export async function deleteVocabularyMeaning(id: string): Promise<void> {
  const { error } = await supabase
    .from("vocabulary_meanings")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
