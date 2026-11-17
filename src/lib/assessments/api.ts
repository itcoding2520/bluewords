import { getJson } from "@/lib/api/get-json";
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
  const data = await getJson<AssessmentAttemptResponse<T>>(
    `/api/assessments/attempts/${attemptId}`,
    fallbackError,
    { cache: "no-store" },
  );
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
