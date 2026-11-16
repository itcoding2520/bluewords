import { getErrorMessage } from "@/lib/errors";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toLocalDateInputValue } from "@/lib/formatDate";
import { scheduleDeferredTask } from "@/lib/schedule-deferred-task";
import { createAssessmentAssignment, fetchAssessmentAdminSnapshot, type AssessmentAdminUser, type AssessmentAssignment, type AssessmentAttempt } from "@/lib/assessments/admin-api";
import { useAdminAssessmentsView } from "@/hooks/useAdminAssessmentsView";

export type AssessmentAdminTab = "tests" | "assignments" | "results";
export function useAdminAssessmentsController() {
  const [activeTab, setActiveTab] = useState<AssessmentAdminTab>("tests");
  const [users, setUsers] = useState<AssessmentAdminUser[]>([]);
  const [assignments, setAssignments] = useState<AssessmentAssignment[]>([]);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [selected, setSelected] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState(false);
  const [dueAt, setDueAt] = useState("");
  const today = toLocalDateInputValue(new Date());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAssessmentAdminSnapshot();
      setUsers(data.users); setAssignments(data.assignments); setAttempts(data.attempts); setError("");
    } catch (cause) { setError(getErrorMessage(cause, "Could not load assignments.")); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    return scheduleDeferredTask(() => { void refresh(); });
  }, [refresh]);

  const assessmentView = useAdminAssessmentsView({ users, assignments, search });

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSending(true); setError(""); setNotice("");
    if (dueAt && today && dueAt < today) {
      setError("Due date must be today or a future date.");
      setSending(false);
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
      setTitle(""); setSelected([]); setAllUsers(false); setDueAt("");
      setActiveTab("tests");
      await refresh();
    } catch (cause) { setError(getErrorMessage(cause, "Could not assign test.")); }
    finally { setSending(false); }
  }

  return {
    navigation: { activeTab, setActiveTab },
    data: { users, assignments, attempts, loading },
    form: {
      title, setTitle, difficulty, setDifficulty, selected, setSelected,
      allUsers, setAllUsers, dueAt, setDueAt, today, search, setSearch, sending,
    },
    feedback: { error, notice },
    view: assessmentView,
    actions: { refresh, assign },
  };
}
