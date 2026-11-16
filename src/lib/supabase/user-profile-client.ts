import { createClient } from "@/lib/supabase/client";

let supabase: ReturnType<typeof createClient> | null = null;

export function getUserProfileSupabase() {
  supabase ??= createClient();
  return supabase;
}
