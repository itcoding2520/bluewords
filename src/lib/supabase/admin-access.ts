import type { createClient } from "@/lib/supabase/client";

type SupabaseClient = ReturnType<typeof createClient>;

export async function isAdminUser(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await supabase.from("app_admins")
    .select("user_id").eq("user_id", userId).maybeSingle();
  return Boolean(data);
}
