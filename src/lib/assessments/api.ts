import { readResponseJson } from "@/lib/api/read-response-json";
import { postJson } from "@/lib/api/post-json";

type AssessmentAttemptResponse<T> = {
  attempt: T;
  error?: string;
};

type AssessmentSubmitResponse = {
  error?: string;
};

export async function fetchAssessmentAttempt<T>(
  attemptId: string,
  fallbackError: string,
): Promise<T> {
  const response = await fetch(`/api/assessments/attempts/${attemptId}`, { cache: "no-store" });
  const data = await readResponseJson<AssessmentAttemptResponse<T>>(response, fallbackError);
  return data.attempt;
}

export async function submitAssessmentAttempt(
  attemptId: string,
  answers: string[],
): Promise<void> {
  await postJson<AssessmentSubmitResponse>(
    `/api/assessments/attempts/${attemptId}`,
    { answers },
    "Could not submit test.",
  );
}
