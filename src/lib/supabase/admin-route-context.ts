import type { User } from "@supabase/supabase-js";
import { type NextResponse } from "next/server";
import { createAdminClient, type AdminClient } from "@/lib/supabase/admin-client";
import { isAdminUser } from "@/lib/supabase/admin-access";
import { getCurrentUserOrNull } from "@/lib/supabase/authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { jsonErrorResponse } from "@/lib/api/json-error-response";

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
    return { response: jsonErrorResponse(failure.message, failure.status) };
  }
  if (!await isAdminUser(supabase, user.id)) {
    return { response: jsonErrorResponse("Admin access required.", 403) };
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return { response: jsonErrorResponse(options.serviceUnavailableMessage, 503) };
  }
  return { user, adminClient };
}
