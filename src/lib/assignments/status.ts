type AssignmentWithStatus = { status: string };

export function getAssignmentCardState(input: {
  status: string;
  latestResult?: string | null;
  latestScore?: number | null;
  overdue: boolean;
  starting: boolean;
}) {
  const failed = input.latestResult === "failed";
  const inProgress = input.status === "in_progress";

  return {
    articleClassName: failed ? "is-retry" : "",
    statusClassName: failed ? "failed" : inProgress ? "in-progress" : "not-started",
    statusLabel: failed
      ? `Try again · last score ${input.latestScore}`
      : inProgress ? "In progress" : "Not started",
    actionLabel: input.starting
      ? "Starting…"
      : failed ? "Try again"
        : inProgress ? "Continue"
          : input.overdue ? "Start late" : "Start test",
  };
}

export function isOutstandingAssignment<T extends AssignmentWithStatus>(assignment: T): boolean {
  return assignment.status !== "completed";
}

export function getOutstandingAssignments<T extends AssignmentWithStatus>(assignments: readonly T[]): T[] {
  return assignments.filter(isOutstandingAssignment);
}

export function countOutstandingAssignments(assignments: readonly AssignmentWithStatus[]): number {
  let count = 0;
  for (const assignment of assignments) {
    if (isOutstandingAssignment(assignment)) count += 1;
  }
  return count;
}
