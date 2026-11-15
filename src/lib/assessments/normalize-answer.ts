export function normalizeAssessmentAnswer(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+([.,!?])/g, "$1")
    .replace(/\s+/g, " ");
}
