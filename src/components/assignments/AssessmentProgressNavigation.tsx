import type { AssessmentQuestionForLearner } from "@/lib/assessments/types";

export function AssessmentProgressNavigation({
  questions,
  answers,
  current,
  onQuestionSelect,
}: {
  questions: AssessmentQuestionForLearner[];
  answers: string[];
  current: number;
  onQuestionSelect: (index: number) => void;
}) {
  return (
    <div className="assessment-progress">
      <div><span>Question {current + 1} of 10</span><b>{current + 1} / 10</b></div>
      <div className="assessment-progress-track"><i style={{ width: `${(current + 1) * 10}%` }} /></div>
      <div className="assessment-question-dots">
        {questions.map((_question, index) => (
          <button
            key={index}
            aria-label={`Go to question ${index + 1}`}
            className={`${index === current ? "active" : ""} ${answers[index] ? "answered" : ""}`}
            onClick={() => onQuestionSelect(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
