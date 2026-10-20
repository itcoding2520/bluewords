ALTER TABLE public.vocabulary_quiz_sessions
  ADD COLUMN is_perfect boolean
  GENERATED ALWAYS AS (correct_count = question_count) STORED;

CREATE INDEX vocabulary_quiz_sessions_user_score_time_idx
  ON public.vocabulary_quiz_sessions (
    user_id,
    is_perfect DESC,
    duration_seconds ASC,
    completed_at DESC,
    id DESC
  );
