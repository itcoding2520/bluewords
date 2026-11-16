import type { Assignment, AssignmentHistoryEntry } from "@/lib/assignments/types";

export function getAssignmentHistory(assignments: Assignment[]): AssignmentHistoryEntry[] {
  const history: AssignmentHistoryEntry[] = [];
  for (const assignment of assignments) {
    for (const attempt of assignment.attempts) {
      if (attempt.completed_at) history.push({ assignment, attempt });
    }
  }
  return history.sort(
    (left, right) => new Date(right.attempt.completed_at!).getTime() - new Date(left.attempt.completed_at!).getTime(),
  );
}
