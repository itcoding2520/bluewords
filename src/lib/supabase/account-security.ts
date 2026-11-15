import type { SupabaseClient } from "@/lib/supabase/client";

export async function updateAccountPassword(
  supabase: SupabaseClient,
  password: string
): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
