export interface AdminUserRecord {
  id: string;
  email: string | null;
  nickname: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface AdminUsersResponse {
  users?: AdminUserRecord[];
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
  const payload = await response.json() as AdminUsersResponse;
  if (!response.ok) throw new Error(payload.error ?? fallbackError);
  return payload;
}

export async function sendAdminUserAction(
  action: string,
  values: Record<string, string>
): Promise<AdminUserActionResponse> {
  const response = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...values }),
  });
  const payload = await response.json() as AdminUserActionResponse;
  if (!response.ok) throw new Error(payload.error ?? "Could not complete this user action.");
  return payload;
}
