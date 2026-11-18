import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";

import { getErrorMessage } from "@/lib/errors";
import { toLocalDateInputValue } from "@/lib/formatDate";
import { createAssessmentAssignment } from "@/lib/assessments/admin-api";
import { runWithBusyState } from "@/lib/run-with-busy-state";

export function useAdminAssessmentAssignment({
  setActiveTab,
  setError,
  setNotice,
  refresh,
}: {
  setActiveTab: (tab: "tests") => void;
  setError: Dispatch<SetStateAction<string>>;
  setNotice: Dispatch<SetStateAction<string>>;
  refresh: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [selected, setSelected] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState(false);
  const [dueAt, setDueAt] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const today = toLocalDateInputValue(new Date());

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runWithBusyState(setSending, async () => {
      setError("");
      setNotice("");
      if (dueAt && today && dueAt < today) {
        setError("Due date must be today or a future date.");
        return;
      }
      try {
        const data = await createAssessmentAssignment({
          title,
          difficulty,
          allUsers,
          recipientIds: selected,
          dueAt: dueAt || null,
        });
        setNotice(`Test assigned to ${data.recipients ?? "selected"} learner(s).`);
        setTitle("");
        setSelected([]);
        setAllUsers(false);
        setDueAt("");
        setActiveTab("tests");
        await refresh();
      } catch (cause) {
        setError(getErrorMessage(cause, "Could not assign test."));
      }
    });
  }

  return {
    form: {
      title,
      setTitle,
      difficulty,
      setDifficulty,
      selected,
      setSelected,
      allUsers,
      setAllUsers,
      dueAt,
      setDueAt,
      today,
      search,
      setSearch,
      sending,
    },
    assign,
  };
}
