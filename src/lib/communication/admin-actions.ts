import type { SupabaseClient } from "@/lib/supabase/client";
import type {
  CommunicationItemDraft,
  CommunicationLessonDraft,
  CommunicationTopicDraft,
} from "@/lib/communication/admin-draft-types";


export function saveCommunicationTopic(
  supabase: SupabaseClient,
  id: string | null,
  payload: CommunicationTopicDraft
) {
  return id
    ? supabase.from("communication_topics").update(payload).eq("id", id)
    : supabase.from("communication_topics").insert(payload);
}

export function removeCommunicationTopic(supabase: SupabaseClient, id: string) {
  return supabase.from("communication_topics").delete().eq("id", id);
}

export function saveCommunicationLesson(
  supabase: SupabaseClient,
  id: string | null,
  payload: CommunicationLessonDraft
) {
  return id
    ? supabase.from("communication_lessons").update(payload).eq("id", id)
    : supabase.from("communication_lessons").insert(payload);
}

export function removeCommunicationLesson(supabase: SupabaseClient, id: string) {
  return supabase.from("communication_lessons").delete().eq("id", id);
}

export function saveCommunicationItem(
  supabase: SupabaseClient,
  id: string | null,
  payload: CommunicationItemDraft
) {
  return id
    ? supabase.from("communication_lesson_items").update(payload).eq("id", id)
    : supabase.from("communication_lesson_items").insert(payload);
}

export function removeCommunicationItem(supabase: SupabaseClient, id: string) {
  return supabase.from("communication_lesson_items").delete().eq("id", id);
}
