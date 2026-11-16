"use client";

import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { useStartAssignedAssessment } from "@/hooks/useStartAssignedAssessment";

export function StartAssignedAssessment({ assignmentId }: { assignmentId: string }) {
  const error = useStartAssignedAssessment(assignmentId);
  return error ? <div><AutoDismissMessage variant="error">{error}</AutoDismissMessage><a className="assessment-back-link" href="/assignments">Back to my assignments</a></div> : <p className="assessment-loading">Preparing your test…</p>;
}
