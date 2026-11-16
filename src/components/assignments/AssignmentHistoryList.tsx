"use client";

import Link from "next/link";
import { ArrowRight, History, Trophy } from "lucide-react";
import { formatDuration } from "@/lib/assignments/format-duration";
import { formatDateTime } from "@/lib/formatDate";
import type { AssignmentHistoryEntry } from "@/lib/assignments/types";

export function AssignmentHistoryList({ entries }: { entries: AssignmentHistoryEntry[] }) {
  return (
    <section className="assignment-history" aria-label="Your test history">
      {entries.map(({ assignment, attempt }) => (
        <article key={attempt.id}>
          <span className="history-trophy"><Trophy size={23} /></span>
          <div>
            <strong>{assignment.assessment?.title ?? "Assessment"}</strong>
            <p>
              {assignment.assessment?.difficulty} · {attempt.correct_count}/10 correct · {formatDuration(attempt.elapsed_seconds ?? 0)}
            </p>
            <small>{formatDateTime(attempt.completed_at!)} · Attempt {attempt.attempt_number}</small>
          </div>
          <b className={attempt.result === "passed" ? "passed" : "failed"}>
            {attempt.score}/100 · {attempt.result === "passed" ? "Passed" : "Not passed"}
          </b>
          <Link href={`/assignments/results/${attempt.id}`}>
            Review answers <ArrowRight size={16} />
          </Link>
        </article>
      ))}
      {entries.length === 0 && (
        <div className="assessment-empty-state">
          <History />
          <h2>Your test history will appear here</h2>
          <p>Only you can see your assessment results.</p>
        </div>
      )}
    </section>
  );
}
