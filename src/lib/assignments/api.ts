import type { Assignment } from "@/lib/assignments/types";

type AssignmentsResponse = {
  assignments: Assignment[];
  error?: string;
};

export async function fetchMyAssignments(): Promise<Assignment[]> {
  const response = await fetch("/api/assessments", { cache: "no-store" });
  const data = await response.json() as AssignmentsResponse;
  if (!response.ok) throw new Error(data.error ?? "Could not load assignments.");
  return data.assignments;
}

type StartAssignmentResponse = {
  attempt: { id: string };
  error?: string;
};

export async function startAssignedAssessment(assignmentId: string): Promise<string> {
  const response = await fetch(`/api/assessments/${assignmentId}/start`, { method: "POST" });
  const data = await response.json() as StartAssignmentResponse;
  if (!response.ok) throw new Error(data.error ?? "Could not start this test.");
  return data.attempt.id;
}
