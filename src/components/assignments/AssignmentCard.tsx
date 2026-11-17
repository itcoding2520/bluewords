import { ArrowRight, BookOpenCheck, CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { formatLocalDate, toVietnamDateKey } from "@/lib/formatDate";
import type { Assignment } from "@/lib/assignments/types";
import { getAssignmentCardState } from "@/lib/assignments/status";
import { ASSESSMENT_QUESTION_COUNT } from "@/lib/assessments/constants";

export function AssignmentCard({
  assignment,
  starting,
  onStart,
}: {
  assignment: Assignment;
  starting: string | null;
  onStart: (assignmentId: string) => Promise<void>;
}) {
  const assessment = assignment.assessment;
  if (!assessment) return null;

  const latest = assignment.attempts[0];
  const due = assessment.dueAt ? new Date(assessment.dueAt) : null;
  const overdue = due && Number.isFinite(due.getTime()) && toVietnamDateKey(due) < toVietnamDateKey(new Date());
  const cardState = getAssignmentCardState({
    status: assignment.status,
    latestResult: latest?.result,
    latestScore: latest?.score,
    overdue: Boolean(overdue),
    starting: starting === assignment.id,
  });

  return (
    <article className={`assignment-card ${cardState.articleClassName}`}>
      <div className="assignment-emoji"><BookOpenCheck size={25} /></div>
      <div className="assignment-card-main">
        <h2>{assessment.title}</h2>
        <span className={`difficulty-pill difficulty-${assessment.difficulty}`}>{assessment.difficulty}</span>
        <p>{ASSESSMENT_QUESTION_COUNT} questions <i>·</i> vocabulary and sentence building <i>·</i> about 10 minutes</p>
      </div>
      <div className="assignment-status">
        <span className={cardState.statusClassName}>{cardState.statusLabel}</span>
        {due && (
          <small className={overdue ? "overdue" : undefined}>
            <CalendarDays size={14} />{overdue ? "Overdue · " : "Due "}{formatLocalDate(due)}
          </small>
        )}
      </div>
      <Button onClick={() => void onStart(assignment.id)} disabled={starting !== null}>
        {cardState.actionLabel}
        <ArrowRight size={17} />
      </Button>
    </article>
  );
}
