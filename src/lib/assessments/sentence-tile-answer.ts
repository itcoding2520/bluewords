import type { AssessmentQuestionForLearner } from "@/lib/assessments/types";

export function toggleSentenceAnswerTile(
  question: Extract<AssessmentQuestionForLearner, { type: "sentence" }>,
  selectedTileIndexes: number[],
  tileIndex: number,
) {
  const nextTileIndexes = selectedTileIndexes.includes(tileIndex)
    ? selectedTileIndexes.filter((selectedIndex) => selectedIndex !== tileIndex)
    : selectedTileIndexes.length < (question.tiles?.length ?? 0)
      ? [...selectedTileIndexes, tileIndex]
      : selectedTileIndexes;
  const answer = nextTileIndexes
    .map((selectedIndex) => question.tiles?.[selectedIndex] ?? "")
    .join(" ")
    .replace(/\s+([.,!?])/g, "$1");

  return { tileIndexes: nextTileIndexes, answer };
}
