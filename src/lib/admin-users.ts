import type { AdminUsersResponse, AdminUserSummary } from "@/lib/admin-user-api";
import { getJson } from "@/lib/api/get-json";
import { chunkArray } from "@/lib/chunk-array";

export async function loadAdminUserEmails(
  userIds: string[],
  errorMessage: string
): Promise<Record<string, string>> {
  const emails: Record<string, string> = {};
  const uniqueIds = [...new Set(userIds)];

  for (const ids of chunkArray(uniqueIds, 100)) {
    const payload = await getJson<AdminUsersResponse<AdminUserSummary>>(
      `/api/admin/users?ids=${ids.join(",")}`,
      errorMessage,
    );
    for (const user of payload.users ?? []) {
      emails[user.id] = user.email ?? "No email";
    }
  }

  return emails;
}
