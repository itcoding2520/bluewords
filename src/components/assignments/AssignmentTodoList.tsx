"use client";

import { ArrowRight, BookOpenCheck, CalendarDays, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatLocalDate, toVietnamDateKey } from "@/lib/formatDate";
import type { Assignment } from "@/lib/assignments/types";

export function AssignmentTodoList({
  assignments,
  starting,
  onStart,
}: {
  assignments: Assignment[];
  starting: string | null;
  onStart: (assignmentId: string) => Promise<void>;
}) {
  return (
    <section className="assignment-list" aria-label="Tests to do">
      {assignments.map((item) => {
        const assessment = item.assessment;
        if (!assessment) return null;

        const latest = item.attempts[0];
        const due = assessment.dueAt ? new Date(assessment.dueAt) : null;
        const overdue = due && Number.isFinite(due.getTime()) && toVietnamDateKey(due) < toVietnamDateKey(new Date());

        return (
          <article key={item.id} className={`assignment-card ${latest?.result === "failed" ? "is-retry" : ""}`}>
            <div className="assignment-emoji"><BookOpenCheck size={25} /></div>
            <div className="assignment-card-main">
              <h2>{assessment.title}</h2>
              <span className={`difficulty-pill difficulty-${assessment.difficulty}`}>{assessment.difficulty}</span>
              <p>10 questions <i>·</i> vocabulary and sentence building <i>·</i> about 10 minutes</p>
            </div>
            <div className="assignment-status">
              <span className={latest?.result === "failed" ? "failed" : item.status === "in_progress" ? "in-progress" : "not-started"}>
                {latest?.result === "failed"
                  ? `Try again · last score ${latest.score}`
                  : item.status === "in_progress" ? "In progress" : "Not started"}
              </span>
              {due && (
                <small className={overdue ? "overdue" : undefined}>
                  <CalendarDays size={14} />{overdue ? "Overdue · " : "Due "}{formatLocalDate(due)}
                </small>
              )}
            </div>
            <Button onClick={() => void onStart(item.id)} disabled={starting !== null}>
              {starting === item.id
                ? "Starting…"
                : latest?.result === "failed" ? "Try again"
                  : item.status === "in_progress" ? "Continue"
                    : overdue ? "Start late" : "Start test"}
              <ArrowRight size={17} />
            </Button>
          </article>
        );
      })}
      {assignments.length === 0 && (
        <div className="assessment-empty-state">
          <CheckCircle2 />
          <h2>You’re all caught up!</h2>
          <p>New assignments from your teacher will appear here.</p>
        </div>
      )}
    </section>
  );
}
