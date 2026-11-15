import { getErrorMessage } from "@/lib/errors";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { startAssignedAssessment } from "@/lib/assignments/api";

export function useStartAssignedAssessment(assignmentId: string) {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void startAssignedAssessment(assignmentId)
      .then((attemptId) => {
        if (active) router.replace(`/assignments/take/${attemptId}`);
      })
      .catch((cause) => {
        if (active) setError(getErrorMessage(cause, "Could not start this test."));
      });

    return () => { active = false; };
  }, [assignmentId, router]);

  return error;
}
