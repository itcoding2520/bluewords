import type { AuthUser } from "@supabase/supabase-js";

export function getAdminUserNickname(
  user: Pick<AuthUser, "user_metadata">,
  profileNickname?: string | null,
): string {
  return profileNickname
    ?? (typeof user.user_metadata.nickname === "string" ? user.user_metadata.nickname : "");
}
