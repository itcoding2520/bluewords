import { createClient } from "@/lib/supabase/client";
import type {
  VocabularyMeaningInsert,
  VocabularyMeaningRow,
  VocabularyMeaningUpdate,
  VocabularyWordRow,
  VocabularyWordUpdate,
} from "@/types/database";
import type { VocabularyType } from "@/config/vocabulary";

const supabase = createClient();

type VocabularyWordInput = Pick<
  VocabularyWordRow,
  "word" | "meaning" | "category" | "status"
> &
  Partial<Pick<VocabularyWordRow, "image_path">> & {
    type?: VocabularyType;
  };

export async function getVocabularyWords(): Promise<
  VocabularyWordRow[]
> {
  const { data, error } = await supabase
    .from("vocabulary_words")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as VocabularyWordRow[];
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

export async function deleteVocabularyWord(
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("vocabulary_words")
    .delete()
    .eq("id", id);

  if (error) throw error;
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