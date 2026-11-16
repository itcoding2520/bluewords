import { useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";

import { getErrorMessage } from "@/lib/errors";
import { submitAssessmentAttempt } from "@/lib/assessments/api";

export function useAssessmentRunnerSubmission({
  attemptId,
  answers,
  setError,
}: {
  attemptId: string;
  answers: string[];
  setError: Dispatch<SetStateAction<string>>;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (answers.some((answer) => !answer.trim())) {
      setError("Answer all 10 questions before submitting.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitAssessmentAttempt(attemptId, answers);
      router.replace(`/assignments/results/${attemptId}`);
    } catch (cause) {
      setError(getErrorMessage(cause, "Could not submit test."));
      setSubmitting(false);
    }
  }

  return { submitting, submit };
}
