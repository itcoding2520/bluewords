"use client";

import type { FormEvent } from "react";
import { CalendarDays, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AssessmentAdminUser, AssessmentAssignment } from "@/lib/assessments/admin-api";
import { AdminAssessmentRecentAssignments } from "@/components/admin/AdminAssessmentRecentAssignments";
import { AdminAssessmentRecipientPicker } from "@/components/admin/AdminAssessmentRecipientPicker";
import { ASSESSMENT_QUESTION_COUNT } from "@/lib/assessments/constants";

export function AdminAssessmentAssignmentsPanel({
  title,
  difficulty,
  users,
  assignments,
  selected,
  onSelectedChange,
  allUsers,
  onAllUsersChange,
  dueAt,
  onDueAtChange,
  today,
  search,
  onSearchChange,
  loading,
  sending,
  visibleUsers,
  onRefresh,
  onAssign,
}: {
  title: string;
  difficulty: string;
  users: AssessmentAdminUser[];
  assignments: AssessmentAssignment[];
  selected: string[];
  onSelectedChange: (update: (current: string[]) => string[]) => void;
  allUsers: boolean;
  onAllUsersChange: (value: boolean) => void;
  dueAt: string;
  onDueAtChange: (value: string) => void;
  today: string;
  search: string;
  onSearchChange: (value: string) => void;
  loading: boolean;
  sending: boolean;
  visibleUsers: AssessmentAdminUser[];
  onRefresh: () => void;
  onAssign: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const selectedIds = new Set(selected);

  return <>
    <form className="assessment-admin-card assessment-create-form" onSubmit={(event) => onAssign(event)}>
      <div className="assessment-card-heading"><span><Users size={19} /></span><div><h2>Assign this test</h2><p>{title || "Add a title in Tests first"} · {difficulty} · {ASSESSMENT_QUESTION_COUNT} questions</p></div></div>
      <div className="assessment-recipient-toggle"><button type="button" className={!allUsers ? "active" : ""} onClick={() => onAllUsersChange(false)}><Users size={16} /> Choose users</button><button type="button" className={allUsers ? "active" : ""} onClick={() => { onAllUsersChange(true); onSelectedChange(() => []); }}><Users size={16} /> All users ({users.length})</button></div>
      {!allUsers && <AdminAssessmentRecipientPicker
        selectedIds={selectedIds}
        search={search}
        visibleUsers={visibleUsers}
        onSelectedChange={onSelectedChange}
        onSearchChange={onSearchChange}
      />}
      <label className="assessment-date-field"><CalendarDays size={17} /> Due date (optional)<input type="date" min={today || undefined} value={dueAt} onChange={(event) => onDueAtChange(event.target.value)} /></label>
      <Button type="submit" disabled={sending || loading || !title.trim() || (!allUsers && selected.length === 0)}><Send size={17} /> Assign test to learners</Button>
    </form>
    <AdminAssessmentRecentAssignments
      assignments={assignments}
      loading={loading}
      onRefresh={onRefresh}
    />
  </>;
}
