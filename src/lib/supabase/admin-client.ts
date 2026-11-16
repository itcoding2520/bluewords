import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export function createAdminClient() {
  if (!serviceKey || !serviceUrl) return null;
  return createSupabaseClient(serviceUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;
