import type { SupabaseClient } from "@/lib/supabase/client";

export function loadSituationalEnglishDialogueTurns(
  supabase: SupabaseClient,
  dialogueIds: string[]
) {
  return dialogueIds.length
    ? supabase.from("communication_dialogue_turns")
      .select("id,dialogue_id,speaker,text_en,meaning_vi,audio_url,response_prompt_vi,expected_response,response_options,turn_order")
      .in("dialogue_id", dialogueIds)
      .order("turn_order")
    : null;
}

export function loadSituationalEnglishLearnerProgress(
  supabase: SupabaseClient,
  userId: string,
  lessonId: string,
  itemIds: string[]
) {
  return Promise.all([
    supabase.from("communication_item_reviews")
      .select("item_id,status,review_count,correct_count")
      .eq("user_id", userId)
      .in("item_id", itemIds),
    supabase.from("communication_lesson_progress")
      .select("status")
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
      .maybeSingle(),
  ]);
}

export function startSituationalEnglishLessonProgress(
  supabase: SupabaseClient,
  userId: string,
  lessonId: string,
  existingProgress: boolean
) {
  return existingProgress
    ? supabase.from("communication_lesson_progress")
      .update({ status: "in_progress", started_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
    : supabase.from("communication_lesson_progress").upsert({
      user_id: userId,
      lesson_id: lessonId,
      status: "in_progress",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,lesson_id" });
}
