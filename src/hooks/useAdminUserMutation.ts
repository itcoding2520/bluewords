import { useState, type Dispatch, type SetStateAction } from "react";

import { getErrorMessage } from "@/lib/errors";
import { sendAdminUserAction, type AdminUserActionInput } from "@/lib/admin-user-api";

export function useAdminUserMutation({
  setError,
  refreshUsers,
}: {
  setError: Dispatch<SetStateAction<string>>;
  refreshUsers: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  async function performUserAction(input: AdminUserActionInput) {
    setBusy("userId" in input ? input.userId : input.action);
    setError("");
    setNotice("");
    try {
      const payload = await sendAdminUserAction(input);
      if (payload.error) {
        setError(payload.error);
        setNotice("");
      } else {
        const fallback = input.action === "delete"
          ? "User removed."
          : input.action === "create"
            ? "User created."
            : "User saved.";
        setError("");
        setNotice(fallback);
        refreshUsers();
      }
      return !payload.error;
    } catch (cause) {
      setError(getErrorMessage(cause, "Could not complete this user action."));
      return false;
    } finally {
      setBusy(null);
    }
  }

  return { busy, notice, setNotice, performUserAction };
}
