import type { AuthUser } from "@supabase/supabase-js";
import type { AdminClient } from "@/lib/supabase/admin-client";

export function getAdminUserNickname(
  user: Pick<AuthUser, "user_metadata">,
  profileNickname?: string | null,
): string {
  return profileNickname
    ?? (typeof user.user_metadata.nickname === "string" ? user.user_metadata.nickname : "");
}

export function mapAdminUserRecord(
  user: AuthUser,
  profileNicknames?: ReadonlyMap<string, string>,
) {
  return {
    id: user.id,
    email: user.email ?? null,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at ?? null,
    nickname: getAdminUserNickname(user, profileNicknames?.get(user.id)),
  };
}

export async function getAdminUserNicknames(adminClient: AdminClient, users: AuthUser[]) {
  if (users.length === 0) return new Map<string, string>();
  const { data, error } = await adminClient.from("user_profiles")
    .select("user_id, nickname")
    .in("user_id", users.map((user) => user.id));
  if (error) {
    console.error("Could not load profiles for admin user list:", error.message);
    return new Map<string, string>();
  }
  const nicknames = new Map<string, string>();
  for (const profile of data ?? []) {
    if (profile.nickname) nicknames.set(profile.user_id, profile.nickname);
  }
  return nicknames;
}
