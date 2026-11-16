import { readResponseJson } from "@/lib/api/read-response-json";
import { postJson } from "@/lib/api/post-json";

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
  return readResponseJson<AssessmentAdminListResponse>(response, "Could not load assignments.");
}

export async function createAssessmentAssignment(input: {
  title: string;
  difficulty: string;
  allUsers: boolean;
  recipientIds: string[];
  dueAt: string | null;
}): Promise<AssessmentAssignmentResponse> {
  return postJson<AssessmentAssignmentResponse>(
    "/api/admin/assessments",
    input,
    "Could not assign test.",
  );
}
