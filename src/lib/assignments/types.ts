export type AssignmentAttempt = {
  id: string;
  attempt_number: number;
  score: number | null;
  correct_count: number | null;
  elapsed_seconds: number | null;
  result: string | null;
  started_at: string;
  completed_at: string | null;
};

export type Assignment = {
  id: string;
  status: string;
  assignedAt: string;
  assessment: {
    id: string;
    title: string;
    difficulty: string;
    dueAt: string | null;
    questions: Array<{ type: string }>;
  } | null;
  attempts: AssignmentAttempt[];
};

export type AssignmentHistoryEntry = {
  assignment: Assignment;
  attempt: AssignmentAttempt;
};
