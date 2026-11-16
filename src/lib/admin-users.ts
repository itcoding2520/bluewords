import type { AdminUsersResponse, AdminUserSummary } from "@/lib/admin-user-api";
import { readResponseJson } from "@/lib/api/read-response-json";

export async function loadAdminUserEmails(
  userIds: string[],
  errorMessage: string
): Promise<Record<string, string>> {
  const emails: Record<string, string> = {};
  const uniqueIds = [...new Set(userIds)];

  for (let start = 0; start < uniqueIds.length; start += 100) {
    const response = await fetch(
      `/api/admin/users?ids=${uniqueIds.slice(start, start + 100).join(",")}`
    );
    const payload = await readResponseJson<AdminUsersResponse<AdminUserSummary>>(response, errorMessage);
    for (const user of payload.users ?? []) {
      emails[user.id] = user.email ?? "No email";
    }
  }

  return emails;
}
