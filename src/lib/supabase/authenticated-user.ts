import type { createClient } from "@/lib/supabase/client";

type SupabaseClient = ReturnType<typeof createClient>;

export async function requireAuthenticatedUser(
  supabase: SupabaseClient,
  errorMessage: string
) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error(errorMessage);
  return user;
}
