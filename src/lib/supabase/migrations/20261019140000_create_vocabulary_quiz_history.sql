CREATE TABLE public.vocabulary_quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('type-word', 'choose-meaning')),
  question_count integer NOT NULL CHECK (question_count IN (10, 20, 30)),
  correct_count integer NOT NULL CHECK (correct_count >= 0 AND correct_count <= question_count),
  duration_seconds integer NOT NULL CHECK (duration_seconds >= 0),
  started_at timestamptz NOT NULL,
  completed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (completed_at >= started_at)
);

CREATE TABLE public.vocabulary_quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.vocabulary_quiz_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vocabulary_word_id uuid REFERENCES public.vocabulary_words(id) ON DELETE SET NULL,
  question_position integer NOT NULL CHECK (question_position > 0),
  prompt_type text NOT NULL CHECK (prompt_type IN ('type-word', 'choose-meaning')),
  word_text text NOT NULL,
  prompt_text text NOT NULL,
  expected_answer text NOT NULL,
  selected_answer text NOT NULL,
  is_correct boolean NOT NULL,
  part_of_speech text,
  choices jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(choices) = 'array'),
  image_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, question_position)
);

CREATE INDEX vocabulary_quiz_sessions_user_completed_idx
  ON public.vocabulary_quiz_sessions (user_id, completed_at DESC);

CREATE INDEX vocabulary_quiz_answers_session_position_idx
  ON public.vocabulary_quiz_answers (session_id, question_position);

ALTER TABLE public.vocabulary_quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_quiz_answers ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES
  ON TABLE public.vocabulary_quiz_sessions, public.vocabulary_quiz_answers
  FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT
  ON TABLE public.vocabulary_quiz_sessions, public.vocabulary_quiz_answers
  TO authenticated;

REVOKE TRUNCATE
  ON TABLE public.vocabulary_quiz_sessions, public.vocabulary_quiz_answers
  FROM anon, authenticated;

CREATE POLICY "Users can view own quiz sessions"
  ON public.vocabulary_quiz_sessions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can add own quiz sessions"
  ON public.vocabulary_quiz_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND question_count IN (10, 20, 30)
    AND correct_count BETWEEN 0 AND question_count
    AND completed_at >= started_at
  );

CREATE POLICY "Users can view own quiz answers"
  ON public.vocabulary_quiz_answers
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can add answers to own quiz sessions"
  ON public.vocabulary_quiz_answers
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.vocabulary_quiz_sessions
      WHERE vocabulary_quiz_sessions.id = session_id
        AND vocabulary_quiz_sessions.user_id = (SELECT auth.uid())
    )
    AND (
      vocabulary_word_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.vocabulary_words
        WHERE vocabulary_words.id = vocabulary_word_id
          AND vocabulary_words.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE OR REPLACE FUNCTION public.save_vocabulary_quiz_session(
  p_mode text,
  p_question_count integer,
  p_correct_count integer,
  p_duration_seconds integer,
  p_started_at timestamptz,
  p_completed_at timestamptz,
  p_answers jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_session_id uuid;
  v_answer jsonb;
  v_answer_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to save quiz history.';
  END IF;

  IF p_mode NOT IN ('type-word', 'choose-meaning')
    OR p_question_count NOT IN (10, 20, 30)
    OR p_correct_count < 0
    OR p_correct_count > p_question_count
    OR p_duration_seconds < 0
    OR p_started_at IS NULL
    OR p_completed_at IS NULL
    OR p_completed_at < p_started_at
    OR p_answers IS NULL
    OR jsonb_typeof(p_answers) <> 'array'
  THEN
    RAISE EXCEPTION 'Invalid quiz session data.';
  END IF;

  SELECT count(*) INTO v_answer_count FROM jsonb_array_elements(p_answers);
  IF v_answer_count <> p_question_count THEN
    RAISE EXCEPTION 'Quiz answer count does not match question count.';
  END IF;

  INSERT INTO public.vocabulary_quiz_sessions (
    user_id, mode, question_count, correct_count, duration_seconds, started_at, completed_at
  ) VALUES (
    v_user_id, p_mode, p_question_count, p_correct_count, p_duration_seconds, p_started_at, p_completed_at
  ) RETURNING id INTO v_session_id;

  FOR v_answer IN SELECT value FROM jsonb_array_elements(p_answers)
  LOOP
    IF NULLIF(v_answer->>'vocabulary_word_id', '') IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.vocabulary_words
        WHERE id = (v_answer->>'vocabulary_word_id')::uuid
          AND user_id = v_user_id
      )
    THEN
      RAISE EXCEPTION 'Quiz answer references a vocabulary word that does not belong to this user.';
    END IF;

    INSERT INTO public.vocabulary_quiz_answers (
      session_id, user_id, vocabulary_word_id, question_position, prompt_type,
      word_text, prompt_text, expected_answer, selected_answer, is_correct,
      part_of_speech, choices, image_path
    ) VALUES (
      v_session_id,
      v_user_id,
      NULLIF(v_answer->>'vocabulary_word_id', '')::uuid,
      (v_answer->>'question_position')::integer,
      p_mode,
      v_answer->>'word_text',
      v_answer->>'prompt_text',
      v_answer->>'expected_answer',
      v_answer->>'selected_answer',
      (v_answer->>'is_correct')::boolean,
      NULLIF(v_answer->>'part_of_speech', ''),
      COALESCE(v_answer->'choices', '[]'::jsonb),
      NULLIF(v_answer->>'image_path', '')
    );
  END LOOP;

  RETURN v_session_id;
END;
$$;

REVOKE ALL PRIVILEGES
  ON FUNCTION public.save_vocabulary_quiz_session(text, integer, integer, integer, timestamptz, timestamptz, jsonb)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
  ON FUNCTION public.save_vocabulary_quiz_session(text, integer, integer, integer, timestamptz, timestamptz, jsonb)
  TO authenticated;
