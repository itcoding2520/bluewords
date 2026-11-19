import type { SupabaseClient } from "@/lib/supabase/client";

export async function getCurrentUserClaimsOrNull(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getClaims();
  return error ? null : data?.claims ?? null;
}

export async function getCurrentUserOrNull(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentSessionUserOrNull(supabase: SupabaseClient) {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

// Client-side identity lookup only. Row-level security remains authoritative for data access.
export async function requireAuthenticatedUser(
  supabase: SupabaseClient,
  errorMessage: string
) {
  const { data: { session }, error } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (error || !user) throw new Error(errorMessage);
  return user;
}
