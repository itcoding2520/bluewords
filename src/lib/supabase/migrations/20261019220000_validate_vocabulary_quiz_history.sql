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
  v_computed_correct_count integer := 0;
  v_position integer;
  v_seen_positions boolean[];
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to save quiz history.';
  END IF;

  IF p_mode IS NULL
    OR p_question_count IS NULL
    OR p_correct_count IS NULL
    OR p_duration_seconds IS NULL
    OR p_mode NOT IN ('type-word', 'choose-meaning')
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

  v_seen_positions := array_fill(false, ARRAY[p_question_count]);
  FOR v_answer IN SELECT value FROM jsonb_array_elements(p_answers)
  LOOP
    IF jsonb_typeof(v_answer) <> 'object'
      OR jsonb_typeof(v_answer->'question_position') <> 'number'
      OR jsonb_typeof(v_answer->'word_text') <> 'string'
      OR jsonb_typeof(v_answer->'prompt_text') <> 'string'
      OR jsonb_typeof(v_answer->'expected_answer') <> 'string'
      OR jsonb_typeof(v_answer->'selected_answer') <> 'string'
      OR jsonb_typeof(v_answer->'is_correct') <> 'boolean'
      OR jsonb_typeof(COALESCE(v_answer->'choices', '[]'::jsonb)) <> 'array'
    THEN
      RAISE EXCEPTION 'Quiz answer data is incomplete or malformed.';
    END IF;

    v_position := (v_answer->>'question_position')::integer;
    IF (v_answer->>'question_position')::numeric <> v_position
      OR v_position < 1 OR v_position > p_question_count OR v_seen_positions[v_position]
    THEN
      RAISE EXCEPTION 'Quiz answer positions must contain each position exactly once.';
    END IF;
    v_seen_positions[v_position] := true;

    IF NULLIF(v_answer->>'expected_answer', '') IS NULL
      OR (
        lower(regexp_replace(btrim(v_answer->>'selected_answer'), '[[:space:]]+', ' ', 'g'))
          = lower(regexp_replace(btrim(v_answer->>'expected_answer'), '[[:space:]]+', ' ', 'g'))
      ) IS DISTINCT FROM (v_answer->>'is_correct')::boolean
    THEN
      RAISE EXCEPTION 'Quiz answer correctness does not match the submitted answers.';
    END IF;

    IF (v_answer->>'is_correct')::boolean THEN
      v_computed_correct_count := v_computed_correct_count + 1;
    END IF;

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
  END LOOP;

  IF array_position(v_seen_positions, false) IS NOT NULL THEN
    RAISE EXCEPTION 'Quiz answer positions must contain each position exactly once.';
  END IF;

  IF v_computed_correct_count <> p_correct_count THEN
    RAISE EXCEPTION 'Quiz score does not match the submitted answers.';
  END IF;

  INSERT INTO public.vocabulary_quiz_sessions (
    user_id, mode, question_count, correct_count, duration_seconds, started_at, completed_at
  ) VALUES (
    v_user_id, p_mode, p_question_count, p_correct_count, p_duration_seconds, p_started_at, p_completed_at
  ) RETURNING id INTO v_session_id;

  FOR v_answer IN SELECT value FROM jsonb_array_elements(p_answers)
  LOOP
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
