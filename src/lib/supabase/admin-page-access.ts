import type { User } from "@supabase/supabase-js";
import { isAdminUser } from "@/lib/supabase/admin-access";
import { getCurrentUserOrNull } from "@/lib/supabase/authenticated-user";
import { createClient } from "@/lib/supabase/server";

export type AdminPageAccess =
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "authorized"; user: User };

export async function getAdminPageAccess(): Promise<AdminPageAccess> {
  const supabase = await createClient();
  const user = await getCurrentUserOrNull(supabase);
  if (!user) return { status: "unauthenticated" };
  if (!await isAdminUser(supabase, user.id)) return { status: "forbidden" };

  return { status: "authorized", user };
}
