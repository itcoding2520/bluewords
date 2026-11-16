import type { AdminClient } from "@/lib/supabase/admin-client";

export type AssessmentRecipientSelection = {
  allUsers: unknown;
  recipientIds: unknown;
};

export type AssessmentRecipientResolution =
  | { status: "error"; message: string }
  | { status: "resolved"; recipientIds: string[] };

export async function resolveAssessmentRecipientIds(
  admin: AdminClient,
  selection: AssessmentRecipientSelection,
): Promise<AssessmentRecipientResolution> {
  if (selection.allUsers === true) {
    const recipientIds: string[] = [];
    let page = 1;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 500 });
      if (error) return { status: "error", message: error.message };
      recipientIds.push(...data.users.map((entry) => entry.id));
      if (data.users.length < 500) break;
      page++;
    }
    return { status: "resolved", recipientIds };
  }

  if (!Array.isArray(selection.recipientIds)) {
    return { status: "resolved", recipientIds: [] };
  }

  return {
    status: "resolved",
    recipientIds: [...new Set(selection.recipientIds.filter((id): id is string => typeof id === "string"))],
  };
}
