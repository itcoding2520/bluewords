import type {
  Assignment,
  AssignmentHistoryEntry,
  AssignmentAttempt,
  CompletedAssignmentAttempt,
} from "@/lib/assignments/types";

function isCompletedAttempt(attempt: AssignmentAttempt): attempt is CompletedAssignmentAttempt {
  return Boolean(attempt.completed_at);
}

export function getAssignmentHistory(assignments: Assignment[]): AssignmentHistoryEntry[] {
  const history: AssignmentHistoryEntry[] = [];
  for (const assignment of assignments) {
    for (const attempt of assignment.attempts) {
      if (isCompletedAttempt(attempt)) history.push({ assignment, attempt });
    }
  }
  return history.sort(
    (left, right) => new Date(right.attempt.completed_at).getTime() - new Date(left.attempt.completed_at).getTime(),
  );
}
