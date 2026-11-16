import type { SupabaseClient } from "@/lib/supabase/client";
import { invalidateCommunicationCatalogCache } from "@/lib/supabase/communication-catalog-cache";
import type { LearningStatus } from "@/types/learning";

interface ItemReviewRecord {
  user_id: string;
  item_id: string;
  status: LearningStatus;
  review_count: number;
  correct_count: number;
  last_reviewed_at: string;
  due_at: string;
  updated_at: string;
}

interface LessonProgressRecord {
  user_id: string;
  lesson_id: string;
  status: "completed" | "in_progress";
  completed_items: number;
  completed_at: string | null;
  updated_at: string;
}

export function upsertCommunicationItemReview(
  supabase: SupabaseClient,
  review: ItemReviewRecord
) {
  return supabase
    .from("communication_item_reviews")
    .upsert(review, { onConflict: "user_id,item_id" });
}

export async function upsertCommunicationLessonProgress(
  supabase: SupabaseClient,
  progress: LessonProgressRecord
) {
  const result = await supabase
    .from("communication_lesson_progress")
    .upsert(progress, { onConflict: "user_id,lesson_id" });

  if (!result.error) invalidateCommunicationCatalogCache(progress.user_id);
  return result;
}
