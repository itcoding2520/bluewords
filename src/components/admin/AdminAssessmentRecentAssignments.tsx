import { CalendarDays, RefreshCw } from "lucide-react";
import { formatLocalDate } from "@/lib/formatDate";
import type { AssessmentAssignment } from "@/lib/assessments/admin-api";

export function AdminAssessmentRecentAssignments({
  assignments,
  loading,
  onRefresh,
}: {
  assignments: AssessmentAssignment[];
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className="assessment-admin-card">
      <div className="assessment-card-heading">
        <span><CalendarDays size={19} /></span>
        <div><h2>Recent assignments</h2><p>Track who has started and completed each test.</p></div>
        <button type="button" className="assessment-refresh" onClick={onRefresh} aria-label="Refresh assignments"><RefreshCw size={17} /></button>
      </div>
      {loading ? (
        <p className="assessment-empty">Loading assignments…</p>
      ) : assignments.length ? (
        <div className="assessment-admin-list">
          {assignments.map((item) => {
            const done = item.assessment_recipients.filter((recipient) => recipient.status === "completed").length;
            const recipientCount = item.assessment_recipients.length;
            const completionPercent = Math.round(done / Math.max(1, recipientCount) * 100);

            return (
              <article key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.difficulty} · 10 questions · {done}/{recipientCount} complete</span>
                  <small>{item.due_at ? `Due ${formatLocalDate(item.due_at)}` : "No due date"}</small>
                </div>
                <span className="assessment-progress">{completionPercent}%</span>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="assessment-empty">No assignments yet.</p>
      )}
    </section>
  );
}
