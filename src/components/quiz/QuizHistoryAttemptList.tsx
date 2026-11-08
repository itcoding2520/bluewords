import { BookOpen, ChevronRight, Clock3, Star, Trophy } from "lucide-react";
import { formatQuizDate } from "@/lib/quiz-format";
import { quizModeLabel } from "@/lib/quiz-mode-model";
import type { VocabularyQuizSessionRow } from "@/types/database";

function rating(score: number, total: number) {
  return total > 0 ? Math.round((score / total) * 5) : 0;
}

export function QuizHistoryAttemptList({
  sessions,
  formatTime,
  onOpenReview,
}: {
  sessions: VocabularyQuizSessionRow[];
  formatTime: (seconds: number) => string;
  onOpenReview: (session: VocabularyQuizSessionRow) => void;
}) {
  return (
    <div className="quiz-history-list space-y-3">
      {sessions.map((session) => (
        <button
          key={session.id}
          type="button"
          aria-label={`Review quiz attempt: ${session.correct_count} of ${session.question_count} correct, ${quizModeLabel(session.mode)}, ${formatTime(session.duration_seconds)}`}
          onClick={() => onOpenReview(session)}
          className="quiz-history-attempt"
        >
          <span className="quiz-history-score">
            <span className="quiz-history-medal"><Trophy size={30} fill="currentColor" /></span>
            <span><strong>{session.correct_count}/{session.question_count}</strong><small>correct</small></span>
          </span>
          <span role="img" aria-label={`${rating(session.correct_count, session.question_count)} out of 5 stars`} className="quiz-history-stars">
            {Array.from({ length: 5 }, (_, index) => (
              <Star key={index} size={30} aria-hidden="true" fill={index < rating(session.correct_count, session.question_count) ? "currentColor" : "none"} />
            ))}
          </span>
          <time className="quiz-history-date" dateTime={session.completed_at}>{formatQuizDate(session.completed_at)}</time>
          <span className="quiz-history-mode"><BookOpen size={20} />{quizModeLabel(session.mode)}</span>
          <span className="quiz-history-duration"><Clock3 size={22} />{formatTime(session.duration_seconds)}</span>
          <span className="quiz-history-open" aria-hidden="true"><ChevronRight size={24} /></span>
        </button>
      ))}
    </div>
  );
}
