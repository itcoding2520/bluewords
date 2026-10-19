CREATE OR REPLACE FUNCTION public.update_vocabulary_word_with_meanings(
  p_vocabulary_word_id uuid,
  p_word text,
  p_meaning text,
  p_category text,
  p_status text,
  p_type text,
  p_ipa text,
  p_image_path text,
  p_meanings jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_word public.vocabulary_words%ROWTYPE;
  v_meaning jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to update vocabulary.';
  END IF;

  IF p_word IS NULL OR btrim(p_word) = ''
    OR p_meaning IS NULL OR btrim(p_meaning) = ''
    OR p_category IS NULL OR btrim(p_category) = ''
    OR p_status NOT IN ('learning', 'mastered')
    OR p_type NOT IN ('word', 'expression')
    OR p_meanings IS NULL
    OR jsonb_typeof(p_meanings) <> 'array'
  THEN
    RAISE EXCEPTION 'Invalid vocabulary word data.';
  END IF;

  UPDATE public.vocabulary_words
  SET word = btrim(p_word),
      meaning = btrim(p_meaning),
      category = p_category,
      status = p_status,
      type = p_type,
      ipa = CASE WHEN p_type = 'word' THEN NULLIF(btrim(p_ipa), '') ELSE NULL END,
      image_path = NULLIF(btrim(p_image_path), '')
  WHERE id = p_vocabulary_word_id
    AND user_id = v_user_id
  RETURNING * INTO v_word;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vocabulary word not found.';
  END IF;

  DELETE FROM public.vocabulary_meanings
  WHERE vocabulary_word_id = p_vocabulary_word_id;

  FOR v_meaning IN SELECT value FROM jsonb_array_elements(p_meanings)
  LOOP
    IF NULLIF(btrim(v_meaning->>'meaning'), '') IS NOT NULL THEN
      INSERT INTO public.vocabulary_meanings (
        vocabulary_word_id, part_of_speech, meaning
      ) VALUES (
        p_vocabulary_word_id,
        v_meaning->>'part_of_speech',
        btrim(v_meaning->>'meaning')
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'word', to_jsonb(v_word),
    'meanings', COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(saved) ORDER BY saved.created_at, saved.id)
        FROM public.vocabulary_meanings AS saved
        WHERE saved.vocabulary_word_id = p_vocabulary_word_id
      ),
      '[]'::jsonb
    )
  );
END;
$$;

REVOKE ALL PRIVILEGES
  ON FUNCTION public.update_vocabulary_word_with_meanings(uuid, text, text, text, text, text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
  ON FUNCTION public.update_vocabulary_word_with_meanings(uuid, text, text, text, text, text, text, text, jsonb)
  TO authenticated;
