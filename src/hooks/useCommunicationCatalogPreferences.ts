import { useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import type { SupabaseClient } from "@/lib/supabase/client";
import type { Goal } from "@/lib/communication/catalog-types";
import { invalidateCommunicationCatalogCache } from "@/lib/supabase/communication-catalog-cache";
import {
  saveCommunicationDailyGoal,
  saveCommunicationLearningGoal,
} from "@/lib/supabase/communication-preferences";


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
    const { error } = await saveCommunicationLearningGoal(supabase, user.id, nextGoal);
    if (error) toast.error(error.message);
    else { invalidateCommunicationCatalogCache(user.id); setGoal(nextGoal); toast.success("Learning goal saved."); }
    setSavingPreference(false);
  }

  async function saveDailyGoal(value: number) {
    setDailyGoal(value);
    if (!authenticated) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await saveCommunicationDailyGoal(supabase, user.id, value);
    if (error) toast.error(error.message); else { invalidateCommunicationCatalogCache(user.id); toast.success("Daily goal saved."); }
  }

  return { savingPreference, saveGoal, saveDailyGoal };
}
