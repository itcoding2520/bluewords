import { getErrorMessage } from "@/lib/errors";
import { useState, type Dispatch, type SetStateAction } from "react";
import { exportAdminUsersCsv } from "@/lib/admin-users-csv.mjs";
import { downloadCsvFile } from "@/lib/download-csv";
import { fetchAdminUsers } from "@/lib/admin-user-api";
import { formatLocalDateForFilename } from "@/lib/formatDate";

export function useAdminUsersExport({
  search,
  setError,
  setNotice,
}: {
  search: string;
  setError: Dispatch<SetStateAction<string>>;
  setNotice: Dispatch<SetStateAction<string>>;
}) {
  const [exporting, setExporting] = useState(false);

  async function exportUsers() {
    setExporting(true);
    setError("");
    try {
      const query = new URLSearchParams({ page: "1", pageSize: "100", all: "true" });
      if (search) query.set("search", search);
      const payload = await fetchAdminUsers(query, "Could not export users.");
      const date = new Date();
      const suffix = formatLocalDateForFilename(date);
      downloadCsvFile(`users_${suffix}.csv`, exportAdminUsersCsv(payload.users ?? []), {
        appendLinkToDocument: true,
        revokeAfterMs: 1000,
      });
      setNotice(`Exported ${payload.users?.length ?? 0} user(s). Passwords are never included.`);
    } catch (cause) {
      setError(getErrorMessage(cause, "Could not export users."));
    } finally {
      setExporting(false);
    }
  }

  return { exporting, exportUsers };
}
