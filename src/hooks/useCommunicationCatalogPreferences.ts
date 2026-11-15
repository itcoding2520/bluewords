import { useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import type { createClient } from "@/lib/supabase/client";
import type { Goal } from "@/lib/communication/catalog-types";
import { invalidateCommunicationCatalogCache } from "@/lib/supabase/communication-catalog-cache";

type SupabaseClient = ReturnType<typeof createClient>;

export function useCommunicationCatalogPreferences({
  supabase,
  authenticated,
  setGoal,
  setDailyGoal,
}: {
  supabase: SupabaseClient;
  authenticated: boolean;
  setGoal: Dispatch<SetStateAction<Goal | null>>;
  setDailyGoal: Dispatch<SetStateAction<number>>;
}) {
  const [savingPreference, setSavingPreference] = useState(false);

  async function saveGoal(nextGoal: Goal) {
    if (!authenticated) { toast.error("Sign in to save your learning goal."); return; }
    setSavingPreference(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingPreference(false); return; }
    const { error } = await supabase.from("communication_learning_preferences").upsert({ user_id: user.id, learning_goal: nextGoal, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) toast.error(error.message);
    else { invalidateCommunicationCatalogCache(user.id); setGoal(nextGoal); toast.success("Learning goal saved."); }
    setSavingPreference(false);
  }

  async function saveDailyGoal(value: number) {
    setDailyGoal(value);
    if (!authenticated) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("communication_daily_goals").upsert({ user_id: user.id, lessons_per_day: value, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) toast.error(error.message); else { invalidateCommunicationCatalogCache(user.id); toast.success("Daily goal saved."); }
  }

  return { savingPreference, saveGoal, saveDailyGoal };
}
