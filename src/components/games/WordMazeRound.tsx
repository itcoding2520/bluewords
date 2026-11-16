import { ArrowRight, Check, Flag, Heart, Map, ShieldAlert, Sparkles, Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PronunciationButton } from "@/components/vocabulary/PronunciationButton";
import { WordMazeMap } from "@/components/games/WordMazeMap";
import { WORD_MAZE_QUESTION_COUNT, type MazeWord } from "@/lib/word-maze";

export function WordMazeRound({
  current, questionIndex, roundLength, score, lives, feedback, selectedChoice, progress, onChoose, onContinue,
}: {
  current: MazeWord;
  questionIndex: number;
  roundLength: number;
  score: number;
  lives: number;
  feedback: "correct" | "wrong" | null;
  selectedChoice: string | null;
  progress: number;
  onChoose: (choice: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="word-maze-game-layout">
      <WordMazeMap progress={progress} feedback={feedback} />
      <Card className="word-maze-question-card">
        <div className="word-maze-stats">
          <span><Flag size={18} /> Level <strong>{questionIndex + 1}/{WORD_MAZE_QUESTION_COUNT}</strong></span>
          <span className="word-maze-stars" aria-label={`${Math.floor(score / 10)} of ${WORD_MAZE_QUESTION_COUNT} stars`}>{Array.from({ length: WORD_MAZE_QUESTION_COUNT }, (_, index) => <Star key={index} size={21} fill={score / 10 > index ? "currentColor" : "none"} />)}</span>
          <span><Map size={18} /> <strong>{questionIndex + 1}/{WORD_MAZE_QUESTION_COUNT}</strong><small>questions</small></span>
          <span className="word-maze-lives" aria-label={`${lives} lives remaining`}>{Array.from({ length: 3 }, (_, index) => <Heart key={index} size={21} fill={index < lives ? "currentColor" : "none"} />)}</span>
        </div>
        <div className="word-maze-question-heading"><PronunciationButton word={current.word} /><div><small>{current.category}</small><h2>What does “{current.word}” mean?</h2></div></div>
        <div className="word-maze-choices">
          {current.choices.map((choice) => {
            const isAnswer = choice === current.meaning;
            const isSelected = selectedChoice === choice;
            const status = feedback === "correct" && isAnswer ? "is-correct" : feedback === "wrong" && isSelected ? "is-wrong" : "";
            return <button key={choice} type="button" onClick={() => onChoose(choice)} className={`word-maze-choice ${status}`} aria-pressed={isSelected}>
              <span>{choice}</span>{feedback === "correct" && isAnswer && <Check size={21} />}{feedback === "wrong" && isSelected && <ShieldAlert size={20} />}
            </button>;
          })}
        </div>
        <div className={`word-maze-feedback ${feedback ?? ""}`} aria-live="polite">
          {feedback === "correct" ? <><span className="word-maze-feedback-mascot">📘</span><p><strong>Correct!</strong><span>Follow the glowing path!</span></p></> : feedback === "wrong" ? <><ShieldAlert size={22} /><p><strong>Not quite!</strong><span>{lives} {lives === 1 ? "life" : "lives"} left. Try another answer.</span></p></> : <><Sparkles size={22} /><p><strong>Choose the right meaning</strong><span>Your mascot is waiting for you!</span></p></>}
        </div>
        {feedback === "correct" && <button type="button" className="word-maze-primary word-maze-continue" onClick={onContinue}>{questionIndex === roundLength - 1 ? "Reach the finish" : "Continue"} <ArrowRight size={22} /></button>}
      </Card>
    </div>
  );
}
