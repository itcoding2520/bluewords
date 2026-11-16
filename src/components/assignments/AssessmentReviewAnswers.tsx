import { CheckCircle2, XCircle } from "lucide-react";
import type { AssessmentReviewQuestion } from "@/lib/assessments/types";

export function AssessmentReviewAnswers({
  questions,
  answers,
  isCorrectAnswer,
}: {
  questions: AssessmentReviewQuestion[];
  answers: string[];
  isCorrectAnswer: (answer: string, expected: string) => boolean;
}) {
  return (
    <section className="assessment-review-answers">
      <div className="assessment-card-heading"><span><CheckCircle2 size={19} /></span><div><h2>Review your answers</h2><p>Only you can see this report.</p></div></div>
      {questions.map((question, index) => {
        const correct = isCorrectAnswer(answers[index] ?? "", question.answer);
        return (
          <article key={index} className={correct ? "correct" : "incorrect"}>
            <span className="assessment-review-index">{index + 1}</span>
            <div>
              <h3>{question.prompt}</h3>
              <p>Your answer: <strong>{answers[index] || "No answer"}</strong></p>
              {!correct && <small>Correct answer: {question.answer}</small>}
            </div>
            {correct ? <CheckCircle2 /> : <XCircle />}
          </article>
        );
      })}
    </section>
  );
}
