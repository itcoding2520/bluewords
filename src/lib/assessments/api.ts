import { readResponseJson } from "@/lib/api/read-response-json";

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
  const response = await fetch(`/api/assessments/attempts/${attemptId}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ answers }),
  });
  await readResponseJson<AssessmentSubmitResponse>(response, "Could not submit test.");
}
