export type AssessmentAdminUser = {
  id: string;
  email: string | undefined;
  nickname: string;
};

export type AssessmentRecipient = {
  id: string;
  user_id: string;
  status: string;
};

export type AssessmentAssignment = {
  id: string;
  title: string;
  difficulty: string;
  due_at: string | null;
  created_at: string;
  assessment_recipients: AssessmentRecipient[];
};

export type AssessmentAttempt = {
  id: string;
  user_id: string;
  recipient_id: string;
  score: number;
  correct_count: number;
  elapsed_seconds: number;
  result: string;
  completed_at: string;
  attempt_number: number;
};

export type AssessmentAdminSnapshot = {
  users: AssessmentAdminUser[];
  assignments: AssessmentAssignment[];
  attempts: AssessmentAttempt[];
};

type AssessmentAdminListResponse = AssessmentAdminSnapshot & { error?: string };
type AssessmentAssignmentResponse = { recipients?: number | string; error?: string };

export async function fetchAssessmentAdminSnapshot(): Promise<AssessmentAdminSnapshot> {
  const response = await fetch("/api/admin/assessments", { cache: "no-store" });
  const data = await response.json() as AssessmentAdminListResponse;
  if (!response.ok) throw new Error(data.error ?? "Could not load assignments.");
  return data;
}

export async function createAssessmentAssignment(input: {
  title: string;
  difficulty: string;
  allUsers: boolean;
  recipientIds: string[];
  dueAt: string | null;
}): Promise<AssessmentAssignmentResponse> {
  const response = await fetch("/api/admin/assessments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json() as AssessmentAssignmentResponse;
  if (!response.ok && response.status !== 207) {
    throw new Error(data.error ?? "Could not assign test.");
  }
  return data;
}
