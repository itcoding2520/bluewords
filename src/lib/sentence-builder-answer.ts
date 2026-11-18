interface SentenceBuilderAnswerOutcomeInput {
  answer: string;
  expectedAnswer: string;
  moves: number;
  score: number;
  correctCount: number;
}

export function getSentenceBuilderAnswerOutcome({
  answer,
  expectedAnswer,
  moves,
  score,
  correctCount,
}: SentenceBuilderAnswerOutcomeInput) {
  const nextMoves = moves + 1;
  if (answer !== expectedAnswer) {
    return {
      moves: nextMoves,
      feedback: "Not quite. Try a different word order.",
    };
  }

  return {
    moves: nextMoves,
    score: score + 10,
    correctCount: correctCount + 1,
    feedback: "Perfect sentence! Great job!",
    solved: true,
  };
}
