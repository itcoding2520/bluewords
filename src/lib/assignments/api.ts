import type { Assignment } from "@/lib/assignments/types";
import { getJson } from "@/lib/api/get-json";
import { readResponseJson } from "@/lib/api/read-response-json";

type AssignmentsResponse = {
  assignments: Assignment[];
  error?: string;
};

export async function fetchMyAssignments(): Promise<Assignment[]> {
  const data = await getJson<AssignmentsResponse>(
    "/api/assessments",
    "Could not load assignments.",
    { cache: "no-store" },
  );
  return data.assignments;
}

type StartAssignmentResponse = {
  attempt: { id: string };
  error?: string;
};

export async function startAssignedAssessment(assignmentId: string): Promise<string> {
  const response = await fetch(`/api/assessments/${assignmentId}/start`, { method: "POST" });
  const data = await readResponseJson<StartAssignmentResponse>(response, "Could not start this test.");
  return data.attempt.id;
}
