CREATE OR REPLACE FUNCTION public.get_vocabulary_page(
  p_page integer,
  p_page_size integer,
  p_search text,
  p_category text,
  p_status text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_search text := NULLIF(btrim(p_search), '');
  v_total bigint;
  v_rows jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF p_page < 1 OR p_page_size < 1 OR p_page_size > 100 THEN
    RAISE EXCEPTION 'Invalid pagination parameters' USING ERRCODE = '22023';
  END IF;

  IF p_status IS NOT NULL AND p_status NOT IN ('learning', 'mastered') THEN
    RAISE EXCEPTION 'Invalid vocabulary status' USING ERRCODE = '22023';
  END IF;

  SELECT count(*)
  INTO v_total
  FROM public.vocabulary_words AS word
  WHERE word.user_id = v_user_id
    AND (p_category IS NULL OR word.category = p_category)
    AND (p_status IS NULL OR word.status = p_status)
    AND (
      v_search IS NULL
      OR word.word ILIKE '%' || v_search || '%'
      OR word.meaning ILIKE '%' || v_search || '%'
      OR EXISTS (
        SELECT 1
        FROM public.vocabulary_meanings AS meaning
        WHERE meaning.vocabulary_word_id = word.id
          AND meaning.meaning ILIKE '%' || v_search || '%'
      )
    );

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', page_word.id,
      'user_id', page_word.user_id,
      'word', page_word.word,
      'meaning', page_word.meaning,
      'category', page_word.category,
      'type', page_word.type,
      'ipa', page_word.ipa,
      'image_path', page_word.image_path,
      'status', page_word.status,
      'created_at', page_word.created_at,
      'updated_at', page_word.updated_at,
      'vocabulary_meanings', COALESCE(meanings.items, '[]'::jsonb)
    ) ORDER BY page_word.created_at DESC, page_word.id DESC
  ), '[]'::jsonb)
  INTO v_rows
  FROM (
    SELECT word.*
    FROM public.vocabulary_words AS word
    WHERE word.user_id = v_user_id
      AND (p_category IS NULL OR word.category = p_category)
      AND (p_status IS NULL OR word.status = p_status)
      AND (
        v_search IS NULL
        OR word.word ILIKE '%' || v_search || '%'
        OR word.meaning ILIKE '%' || v_search || '%'
        OR EXISTS (
          SELECT 1
          FROM public.vocabulary_meanings AS meaning
          WHERE meaning.vocabulary_word_id = word.id
            AND meaning.meaning ILIKE '%' || v_search || '%'
        )
      )
    ORDER BY word.created_at DESC, word.id DESC
    LIMIT p_page_size
    OFFSET (p_page - 1) * p_page_size
  ) AS page_word
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', detail.id,
        'vocabulary_word_id', detail.vocabulary_word_id,
        'part_of_speech', detail.part_of_speech,
        'meaning', detail.meaning,
        'created_at', detail.created_at
      ) ORDER BY detail.created_at ASC, detail.id ASC
    ) AS items
    FROM public.vocabulary_meanings AS detail
    WHERE detail.vocabulary_word_id = page_word.id
  ) AS meanings ON true;

  RETURN jsonb_build_object('rows', v_rows, 'total', v_total);
END;
$$;

REVOKE ALL ON FUNCTION public.get_vocabulary_page(integer, integer, text, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_vocabulary_page(integer, integer, text, text, text)
  TO authenticated;
