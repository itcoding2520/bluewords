import { getErrorMessage } from "@/lib/errors";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { getAdminCachedData } from "@/lib/admin-data-cache.mjs";
import { fetchAdminUsers } from "@/lib/admin-user-api";

export type AdminNotificationRecipient = { id: string; email: string | null; nickname: string };

export function useAdminNotificationRecipients(
  currentUserId: string,
  setError: Dispatch<SetStateAction<string>>
) {
  const [recipients, setRecipients] = useState<AdminNotificationRecipient[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadRecipients() {
      try {
        const query = new URLSearchParams({ page: "1", pageSize: "100", all: "true" });
        const payload = await getAdminCachedData(
          "admin:users:all-recipients",
          () => fetchAdminUsers(query)
        );
        if (active) setRecipients((payload.users ?? []).filter((recipient) => recipient.id !== currentUserId));
      } catch (cause) {
        if (active) setError(getErrorMessage(cause, "Could not load users."));
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadRecipients();
    return () => { active = false; };
  }, [currentUserId, setError]);

  const filteredRecipients = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase();
    if (!normalized) return recipients;
    return recipients.filter((recipient) => `${recipient.email ?? ""} ${recipient.nickname}`.toLocaleLowerCase().includes(normalized));
  }, [recipients, search]);
  const selectedRecipients = useMemo(() => recipients.filter((recipient) => selected.includes(recipient.id)), [recipients, selected]);

  function toggleRecipient(id: string, checked: boolean) {
    setSelected((current) => checked ? [...current, id] : current.filter((selectedId) => selectedId !== id));
  }

  return {
    recipients,
    selected,
    setSelected,
    allUsers,
    setAllUsers,
    search,
    setSearch,
    loading,
    filteredRecipients,
    selectedRecipients,
    toggleRecipient,
  };
}
