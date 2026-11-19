interface WordMazeAnswerOutcomeInput {
  choice: string;
  isCorrect: boolean;
  moves: number;
  score: number;
  lives: number;
}

export function getWordMazeAnswerOutcome({
  choice,
  isCorrect,
  moves,
  score,
  lives,
}: WordMazeAnswerOutcomeInput) {
  if (isCorrect) {
    return {
      moves: moves + 1,
      selectedChoice: choice,
      score: score + 10,
      feedback: "correct" as const,
    };
  }

  return {
    moves: moves + 1,
    selectedChoice: choice,
    lives: lives - 1,
    feedback: "wrong" as const,
  };
}
