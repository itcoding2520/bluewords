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
  const data = await response.json() as AssessmentAttemptResponse<T>;
  if (!response.ok) throw new Error(data.error ?? fallbackError);
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
  const data = await response.json() as AssessmentSubmitResponse;
  if (!response.ok) throw new Error(data.error ?? "Could not submit test.");
}
