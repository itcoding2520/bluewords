import { createClient, type SupabaseClient } from "@/lib/supabase/client";
import type { SentenceBuilderQuestion, SentenceQuestionInput } from "@/lib/sentence-builder";

export type { SentenceBuilderQuestion, SentenceDifficulty, SentenceQuestionInput } from "@/lib/sentence-builder";
export { exportSentenceBuilderCsv, parseSentenceBuilderCsv } from "@/lib/sentence-builder-csv";

export async function loadSentenceBuilderQuestions(activeOnly = true) {
  const supabase = createClient();
  let query = supabase.from("sentence_builder_questions").select("*").order("question_id");
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SentenceBuilderQuestion[];
}

export function saveSentenceBuilderQuestion(
  supabase: SupabaseClient,
  questionId: string | null,
  input: SentenceQuestionInput,
  updatedAt: string
) {
  return questionId
    ? supabase.from("sentence_builder_questions")
      .update({ ...input, updated_at: updatedAt }).eq("id", questionId)
    : supabase.from("sentence_builder_questions").insert(input);
}

export function removeSentenceBuilderQuestion(supabase: SupabaseClient, id: string) {
  return supabase.from("sentence_builder_questions").delete().eq("id", id);
}

export function importSentenceBuilderQuestions(
  supabase: SupabaseClient,
  rows: SentenceQuestionInput[]
) {
  return supabase.from("sentence_builder_questions")
    .upsert(rows, { onConflict: "question_id" });
}
