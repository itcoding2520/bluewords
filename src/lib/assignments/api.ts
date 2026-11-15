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
