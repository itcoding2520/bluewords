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
  v_distinct_positions integer;
  v_first_position integer;
  v_last_position integer;
  v_correct_answer_count integer;
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

  SELECT count(*)
  INTO v_answer_count
  FROM jsonb_array_elements(p_answers);

  IF v_answer_count <> p_question_count THEN
    RAISE EXCEPTION 'Quiz answer count does not match question count.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_answers) AS answers(value)
    WHERE jsonb_typeof(answers.value->'question_position') <> 'number'
      OR (answers.value->>'question_position') !~ '^[1-9][0-9]*$'
      OR jsonb_typeof(answers.value->'is_correct') <> 'boolean'
  ) THEN
    RAISE EXCEPTION 'Quiz answers must include valid question positions and correctness values.';
  END IF;

  SELECT
    count(DISTINCT (answers.value->>'question_position')::integer),
    min((answers.value->>'question_position')::integer),
    max((answers.value->>'question_position')::integer),
    count(*) FILTER (WHERE (answers.value->>'is_correct')::boolean)
  INTO
    v_distinct_positions,
    v_first_position,
    v_last_position,
    v_correct_answer_count
  FROM jsonb_array_elements(p_answers) AS answers(value);

  IF v_distinct_positions <> p_question_count
    OR v_first_position <> 1
    OR v_last_position <> p_question_count
  THEN
    RAISE EXCEPTION 'Quiz question positions must cover 1 through the question count exactly once.';
  END IF;

  IF v_correct_answer_count <> p_correct_count THEN
    RAISE EXCEPTION 'Quiz correct count does not match the answer snapshots.';
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
