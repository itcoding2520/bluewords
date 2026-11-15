export function normalizeAssessmentAnswer(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+([.,!?])/g, "$1")
    .replace(/\s+/g, " ");
}

export function areAssessmentAnswersEqual(answer: string, expected: string): boolean {
  return normalizeAssessmentAnswer(answer) === normalizeAssessmentAnswer(expected);
}
