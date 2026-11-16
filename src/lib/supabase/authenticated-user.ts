import type { SupabaseClient } from "@/lib/supabase/client";

export async function getCurrentUserOrNull(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireAuthenticatedUser(
  supabase: SupabaseClient,
  errorMessage: string
) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error(errorMessage);
  return user;
}
