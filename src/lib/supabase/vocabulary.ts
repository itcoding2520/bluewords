
import { createClient } from "@/lib/supabase/client";
import type {
  VocabularyWordRow,
  VocabularyWordUpdate,
} from "@/types/database";

const supabase = createClient();

type VocabularyWordInput = Pick<
  VocabularyWordRow,
  "word" | "meaning" | "category" | "status"
>;

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
