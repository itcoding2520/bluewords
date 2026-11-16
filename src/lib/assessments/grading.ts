import { areAssessmentAnswersEqual } from "@/lib/assessments/normalize-answer";
import type { AssessmentQuestion } from "@/lib/assessments/types";

export const ASSESSMENT_PASSING_SCORE = 50;

export function isAssessmentPassingScore(score: number) {
  return score > ASSESSMENT_PASSING_SCORE;
}

export function gradeAssessmentAttempt(questions: AssessmentQuestion[], answers: readonly unknown[]) {
  const correctCount = questions.reduce(
    (total, question, index) => total + (areAssessmentAnswersEqual(String(answers[index]), question.answer) ? 1 : 0),
    0,
  );
  const score = correctCount * 10;

  return {
    correctCount,
    score,
    result: isAssessmentPassingScore(score) ? "passed" as const : "failed" as const,
  };
}
