import { useMemo } from "react";
import type {
  AssessmentAdminUser,
  AssessmentAssignment,
} from "@/lib/assessments/admin-api";

export function useAdminAssessmentsView({
  users,
  assignments,
  search,
}: {
  users: AssessmentAdminUser[];
  assignments: AssessmentAssignment[];
  search: string;
}) {
  const normalizedSearch = search.toLowerCase();
  const visibleUsers = useMemo(
    () => users.filter((item) => `${item.nickname} ${item.email ?? ""}`.toLowerCase().includes(normalizedSearch)),
    [users, normalizedSearch],
  );
  const userById = useMemo(() => {
    const usersById = new Map<string, AssessmentAdminUser>();
    for (const user of users) usersById.set(user.id, user);
    return usersById;
  }, [users]);
  const assignmentByRecipientId = useMemo(() => {
    const assignmentsByRecipient = new Map<string, AssessmentAssignment>();
    for (const assignment of assignments) {
      for (const recipient of assignment.assessment_recipients) {
        if (!assignmentsByRecipient.has(recipient.id)) assignmentsByRecipient.set(recipient.id, assignment);
      }
    }
    return assignmentsByRecipient;
  }, [assignments]);

  return { visibleUsers, userById, assignmentByRecipientId };
}
