"use client";

import { CheckCircle2 } from "lucide-react";
import { AssignmentCard } from "@/components/assignments/AssignmentCard";
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
      {assignments.map((assignment) => (
        <AssignmentCard key={assignment.id} assignment={assignment} starting={starting} onStart={onStart} />
      ))}
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
