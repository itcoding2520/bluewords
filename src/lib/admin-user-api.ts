import { readResponseJson } from "@/lib/api/read-response-json";
import { postJson } from "@/lib/api/post-json";

export interface AdminUserSummary {
  id: string;
  email: string | null;
}

export interface AdminUserRecord extends AdminUserSummary {
  nickname: string;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface AdminUsersResponse<TUser extends AdminUserSummary = AdminUserRecord> {
  users?: TUser[];
  total?: number;
  error?: string;
}

interface AdminUserActionResponse {
  error?: string;
}

export async function fetchAdminUsers(
  query: URLSearchParams,
  fallbackError = "Could not load users."
): Promise<AdminUsersResponse> {
  const response = await fetch(`/api/admin/users?${query}`, {
    cache: "no-store",
  });
  return readResponseJson<AdminUsersResponse>(response, fallbackError);
}

export async function sendAdminUserAction(
  action: string,
  values: Record<string, string>
): Promise<AdminUserActionResponse> {
  return postJson<AdminUserActionResponse>(
    "/api/admin/users",
    { action, ...values },
    "Could not complete this user action.",
  );
}
