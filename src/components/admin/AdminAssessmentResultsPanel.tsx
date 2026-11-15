"use client";

import { RefreshCw, Users } from "lucide-react";
import type { AssessmentAssignment, AssessmentAttempt } from "@/lib/assessments/admin-api";
import { AdminAssessmentResultRow } from "@/components/admin/AdminAssessmentResultRow";

export function AdminAssessmentResultsPanel({
  attempts,
  userById,
  assignmentByRecipientId,
  loading,
  onRefresh,
}: {
  attempts: AssessmentAttempt[];
  userById: Map<string, { nickname: string; email: string | undefined }>;
  assignmentByRecipientId: Map<string, AssessmentAssignment>;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className="assessment-admin-card assessment-results-full">
      <div className="assessment-card-heading">
        <span><Users size={19} /></span>
        <div><h2>Assessment results</h2><p>Completed attempts are visible to administrators here.</p></div>
        <button type="button" className="assessment-refresh" onClick={onRefresh} aria-label="Refresh results"><RefreshCw size={17} /></button>
      </div>
      {loading ? (
        <p className="assessment-empty">Loading results…</p>
      ) : attempts.length ? (
        <div className="assessment-admin-list">
          {attempts.map((attempt) => {
            const learner = userById.get(attempt.user_id);
            const assignment = assignmentByRecipientId.get(attempt.recipient_id);
            return (
              <AdminAssessmentResultRow
                key={attempt.id}
                attempt={attempt}
                learnerName={learner?.nickname || learner?.email || "Learner"}
                assignmentTitle={assignment?.title ?? "Assessment"}
              />
            );
          })}
        </div>
      ) : (
        <p className="assessment-empty">Completed tests will appear here.</p>
      )}
    </section>
  );
}
