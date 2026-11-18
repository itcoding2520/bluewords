interface WordScrambleAnswerOutcomeInput {
  answer: string;
  expectedAnswer: string;
  displayWord: string;
  usedHint: boolean;
  moves: number;
  streak: number;
  bestStreak: number;
  score: number;
}

export function getWordScrambleAnswerOutcome({
  answer,
  expectedAnswer,
  displayWord,
  usedHint,
  moves,
  streak,
  bestStreak,
  score,
}: WordScrambleAnswerOutcomeInput) {
  const nextMoves = moves + 1;
  if (answer !== expectedAnswer) {
    return {
      moves: nextMoves,
      streak: 0,
      feedback: "Almost! Rearrange the letters and try again.",
      isCorrect: false,
    };
  }

  const nextStreak = streak + 1;
  return {
    moves: nextMoves,
    streak: nextStreak,
    bestStreak: Math.max(bestStreak, nextStreak),
    score: score + (usedHint ? 10 : 20),
    feedback: `Great job! ${displayWord} is correct!`,
    isCorrect: true,
  };
}
