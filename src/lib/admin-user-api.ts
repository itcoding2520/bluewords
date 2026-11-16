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
  const response = await fetch(`/api/admin/users?${query}`, {
    cache: "no-store",
  });
  return readResponseJson<AdminUsersResponse>(response, fallbackError);
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
