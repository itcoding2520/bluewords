export const ASSESSMENT_QUESTION_COUNTS = {
  vocabulary: 5,
  sentence: 5,
} as const;

export const ASSESSMENT_QUESTION_COUNT =
  ASSESSMENT_QUESTION_COUNTS.vocabulary + ASSESSMENT_QUESTION_COUNTS.sentence;
