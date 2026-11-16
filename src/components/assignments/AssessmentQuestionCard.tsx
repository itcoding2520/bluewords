import Image from "next/image";
import { Lightbulb } from "lucide-react";
import type { AssessmentQuestionForLearner } from "@/lib/assessments/types";

export function AssessmentQuestionCard({
  question,
  answer,
  sentenceTiles,
  onAnswer,
  onSentenceTileToggle,
  onClearSentence,
}: {
  question: AssessmentQuestionForLearner;
  answer: string;
  sentenceTiles: number[];
  onAnswer: (answer: string) => void;
  onSentenceTileToggle: (tileIndex: number) => void;
  onClearSentence: () => void;
}) {
  return (
    <section className="assessment-question-card">
      <span className={`assessment-question-type ${question.type}`}>{question.type === "sentence" ? "Build the sentence" : "Vocabulary"}</span>
      <h2>{question.prompt}</h2>
      {question.type === "vocabulary" && question.imageUrl && (
        <Image src={question.imageUrl} alt={question.word ? `Picture clue for ${question.word}` : "Vocabulary picture clue"} width={220} height={150} unoptimized className="assessment-question-image" />
      )}
      {question.type === "vocabulary" ? (
        <div className="assessment-answer-options">
          {question.choices?.map((choice) => <button key={choice} className={answer === choice ? "selected" : ""} onClick={() => onAnswer(choice)}>{choice}</button>)}
        </div>
      ) : (
        <>
          <div className="assessment-sentence-answer" aria-label="Your sentence">
            {sentenceTiles.length ? sentenceTiles.map((tileIndex, order) => <button key={`${tileIndex}-${order}`} onClick={() => onSentenceTileToggle(tileIndex)}>{question.tiles?.[tileIndex]}</button>) : <span>Tap word tiles in the correct order</span>}
          </div>
          <div className="assessment-sentence-tiles">
            {question.tiles?.map((tile, index) => <button key={`${tile}-${index}`} disabled={sentenceTiles.includes(index)} onClick={() => onSentenceTileToggle(index)}>{tile}</button>)}
          </div>
          <button className="assessment-clear-answer" onClick={onClearSentence}>Clear sentence</button>
        </>
      )}
      <p className="assessment-shuffle-note"><Lightbulb size={16} /> Questions mix vocabulary meanings and sentence building. Question order is randomized.</p>
    </section>
  );
}
