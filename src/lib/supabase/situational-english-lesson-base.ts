import type { SupabaseClient } from "@/lib/supabase/client";
import type { Dialogue, Item, Lesson, Topic } from "@/lib/communication/lesson-types";

export async function loadSituationalEnglishLessonBase(
  supabase: SupabaseClient,
  lessonId: string
) {
  const lessonResult = await supabase.from("communication_lessons")
    .select("id,topic_id,title_en,title_vi,difficulty,status")
    .eq("id", lessonId)
    .eq("status", "published")
    .maybeSingle();
  if (lessonResult.error) throw lessonResult.error;
  if (!lessonResult.data) return null;

  const lesson = lessonResult.data as Lesson;
  const [topicResult, itemResult, dialogueResult, authResult] = await Promise.all([
    supabase.from("communication_topics")
      .select("id,title_en,title_vi")
      .eq("id", lesson.topic_id)
      .eq("status", "published")
      .maybeSingle(),
    supabase.from("communication_lesson_items")
      .select("id,item_key,item_type,content_en,meaning_vi,example_en,example_vi,image_keyword,audio_url,sort_order")
      .eq("lesson_id", lessonId)
      .order("sort_order"),
    supabase.from("communication_dialogues")
      .select("id,title_en,title_vi,prompt_vi,sort_order")
      .eq("lesson_id", lessonId)
      .order("sort_order"),
    supabase.auth.getUser(),
  ]);
  if (topicResult.error) throw topicResult.error;
  if (itemResult.error) throw itemResult.error;
  if (dialogueResult.error) throw dialogueResult.error;

  return {
    lesson,
    topic: topicResult.data as Topic | null,
    items: (itemResult.data ?? []) as Item[],
    dialogues: (dialogueResult.data ?? []) as Dialogue[],
    userId: authResult.data.user?.id ?? null,
  };
}
