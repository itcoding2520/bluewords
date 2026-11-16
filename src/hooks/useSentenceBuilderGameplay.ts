import { useState } from "react";
import { createSentenceBuilderTiles, type SentenceBuilderQuestion, type SentenceBuilderTile } from "@/lib/sentence-builder";

export function useSentenceBuilderGameplay() {
  const [round, setRound] = useState<SentenceBuilderQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [tiles, setTiles] = useState<SentenceBuilderTile[]>([]);
  const [chosen, setChosen] = useState<SentenceBuilderTile[]>([]);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [hints, setHints] = useState(3);
  const [feedback, setFeedback] = useState("");
  const [solved, setSolved] = useState(false);
  const current = round[index];

  function startRound(nextRound: SentenceBuilderQuestion[]) {
    setRound(nextRound);
    setIndex(0);
    setChosen([]);
    setTiles(createSentenceBuilderTiles(nextRound[0]));
    setScore(0);
    setCorrectCount(0);
    setMoves(0);
    setHints(3);
    setFeedback("");
    setSolved(false);
  }

  function choose(tile: SentenceBuilderTile) {
    if (solved || chosen.some((item) => item.id === tile.id)) return;
    setChosen((previous) => [...previous, tile]);
    setFeedback("");
  }

  function removeTile(tileId: number) {
    setChosen((previous) => previous.filter((tile) => tile.id !== tileId));
    setFeedback("");
  }

  function removeLastTile() {
    setChosen((previous) => previous.slice(0, -1));
    setFeedback("");
  }

  function submit() {
    if (!current || solved || !chosen.length) return;
    setMoves((value) => value + 1);
    const answer = chosen.map((tile) => tile.text).join(" ");
    if (answer === current.answer_tokens.join(" ")) {
      setScore((value) => value + 10);
      setCorrectCount((value) => value + 1);
      setFeedback("Perfect sentence! Great job!");
      setSolved(true);
    } else setFeedback("Not quite. Try a different word order.");
  }

  function useHint() {
    if (!current || solved || hints < 1) return;
    const expected = current.answer_tokens[chosen.length];
    const tile = tiles.find((item) => item.text === expected && !chosen.some((picked) => picked.id === item.id));
    if (!tile) return;
    setChosen((previous) => [...previous, tile]);
    setHints((count) => count - 1);
    setFeedback("Hint added the next word tile.");
  }

  function nextQuestion(): boolean {
    if (index + 1 >= round.length) return true;
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setChosen([]);
    setTiles(createSentenceBuilderTiles(round[nextIndex]));
    setFeedback("");
    setSolved(false);
    return false;
  }

  return {
    round, index, tiles, chosen, score, correctCount, moves, hints, feedback, solved, current,
    startRound, choose, removeTile, removeLastTile, submit, useHint, nextQuestion,
  };
}
