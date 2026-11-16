type AssignmentWithStatus = { status: string };

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
