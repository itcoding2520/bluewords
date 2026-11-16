import { toVietnamDateKey } from "@/lib/formatDate";
import { isObjectRecord } from "@/lib/is-object-record";
import { isDifficultyLevel, type DifficultyLevel } from "@/types/difficulty";

export type AssessmentDifficulty = DifficultyLevel;

type ValidatedAssignmentInput = {
  title: string;
  difficulty: AssessmentDifficulty;
  dueAt: Date | null;
};

type AssignmentInputResult =
  | { ok: true; value: ValidatedAssignmentInput }
  | { ok: false; message: string };

export function validateAssessmentAssignmentInput(input: unknown): AssignmentInputResult {
  if (!isObjectRecord(input)) {
    return { ok: false, message: "Invalid request." };
  }

  const body = input;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const difficulty = String(body.difficulty);
  if (!title || title.length > 120 || !isDifficultyLevel(difficulty)) {
    return { ok: false, message: "Enter a title and select a difficulty." };
  }

  const dueAtValue = typeof body.dueAt === "string" && body.dueAt ? body.dueAt : null;
  let dueAt: Date | null = null;
  if (dueAtValue) {
    const dueDateOnly = dueAtValue.slice(0, 10);
    const dateParts = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(dueDateOnly);
    if (!dateParts) return { ok: false, message: "Invalid due date." };
    const [, year, month, day] = dateParts;
    const checkDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (
      checkDate.getUTCFullYear() !== Number(year)
      || checkDate.getUTCMonth() + 1 !== Number(month)
      || checkDate.getUTCDate() !== Number(day)
    ) {
      return { ok: false, message: "Invalid due date." };
    }

    if (dueDateOnly < toVietnamDateKey(new Date())) {
      return { ok: false, message: "Due date must be today or a future date." };
    }
    // Keep the assignment available through the selected date in Vietnam time (UTC+7).
    dueAt = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 16, 59, 59, 999));
  }

  return {
    ok: true,
    value: {
      title,
      difficulty,
      dueAt,
    },
  };
}
