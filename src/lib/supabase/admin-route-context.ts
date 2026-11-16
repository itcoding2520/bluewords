import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createAdminClient, type AdminClient } from "@/lib/supabase/admin-client";
import { isAdminUser } from "@/lib/supabase/admin-access";
import { getCurrentUserOrNull } from "@/lib/supabase/authenticated-user";
import { createClient } from "@/lib/supabase/server";

export type AdminRouteContextResult =
  | { response: NextResponse }
  | { user: User; adminClient: AdminClient };

export async function authorizeAdminRoute(
  options: {
    serviceUnavailableMessage: string;
    authenticationFailure?: { message: string; status: 401 | 403 };
  },
): Promise<AdminRouteContextResult> {
  const supabase = await createClient();
  const user = await getCurrentUserOrNull(supabase);
  if (!user) {
    const failure = options.authenticationFailure ?? { message: "Authentication required.", status: 401 };
    return { response: NextResponse.json({ error: failure.message }, { status: failure.status }) };
  }
  if (!await isAdminUser(supabase, user.id)) {
    return { response: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return { response: NextResponse.json({ error: options.serviceUnavailableMessage }, { status: 503 }) };
  }
  return { user, adminClient };
}
