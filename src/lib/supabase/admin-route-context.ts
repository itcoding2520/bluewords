import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createAdminClient, type AdminClient } from "@/lib/supabase/admin-client";
import { isAdminUser } from "@/lib/supabase/admin-access";
import { createClient } from "@/lib/supabase/server";

type AdminRouteContextResult =
  | { response: NextResponse }
  | { user: User; adminClient: AdminClient };

export async function authorizeAdminRoute(
  serviceUnavailableMessage: string,
): Promise<AdminRouteContextResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }
  if (!await isAdminUser(supabase, user.id)) {
    return { response: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return { response: NextResponse.json({ error: serviceUnavailableMessage }, { status: 503 }) };
  }
  return { user, adminClient };
}
