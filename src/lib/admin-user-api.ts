import { getJson } from "@/lib/api/get-json";
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

export function buildAdminUsersQuery(input: {
  page: number;
  pageSize: number;
  search?: string;
  all?: boolean;
}): URLSearchParams {
  const query = new URLSearchParams({
    page: String(input.page),
    pageSize: String(input.pageSize),
  });
  if (input.search) query.set("search", input.search);
  if (input.all) query.set("all", "true");
  return query;
}

interface AdminUserActionResponse {
  error?: string;
}

export type AdminUserActionInput =
  | { action: "create"; email: string; nickname: string; password: string }
  | { action: "update"; userId: string; email: string; nickname: string; password?: string }
  | { action: "delete"; userId: string };

export async function fetchAdminUsers(
  query: URLSearchParams,
  fallbackError = "Could not load users."
): Promise<AdminUsersResponse> {
  return getJson<AdminUsersResponse>(`/api/admin/users?${query}`, fallbackError, {
    cache: "no-store",
  });
}

export async function sendAdminUserAction(
  input: AdminUserActionInput,
): Promise<AdminUserActionResponse> {
  return postJson<AdminUserActionResponse>(
    "/api/admin/users",
    input,
    "Could not complete this user action.",
  );
}
