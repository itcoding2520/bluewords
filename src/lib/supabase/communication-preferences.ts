import type { Goal } from "@/lib/communication/catalog-types";
import type { SupabaseClient } from "@/lib/supabase/client";

export function saveCommunicationLearningGoal(
  supabase: SupabaseClient,
  userId: string,
  goal: Goal
) {
  return supabase.from("communication_learning_preferences").upsert({
    user_id: userId,
    learning_goal: goal,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
}

export function saveCommunicationDailyGoal(
  supabase: SupabaseClient,
  userId: string,
  lessonsPerDay: number
) {
  return supabase.from("communication_daily_goals").upsert({
    user_id: userId,
    lessons_per_day: lessonsPerDay,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
}
