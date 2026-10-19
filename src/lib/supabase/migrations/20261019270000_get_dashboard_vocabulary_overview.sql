CREATE OR REPLACE FUNCTION public.get_dashboard_vocabulary_overview()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH own_words AS MATERIALIZED (
    SELECT words.id,
           words.word,
           words.meaning,
           words.category,
           words.status,
           words.type,
           words.ipa,
           words.image_path,
           words.created_at,
           categories.color AS category_color
    FROM public.vocabulary_words AS words
    LEFT JOIN public.vocabulary_categories AS categories
      ON categories.user_id = words.user_id
     AND categories.name = words.category
    WHERE words.user_id = (SELECT auth.uid())
  ),
  stats AS (
    SELECT count(*)::integer AS total,
           count(*) FILTER (WHERE status = 'mastered')::integer AS mastered,
           count(*) FILTER (WHERE status = 'learning')::integer AS learning
    FROM own_words
  ),
  recent_words AS (
    SELECT coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', recent.id,
          'word', recent.word,
          'meaning', recent.meaning,
          'category', recent.category,
          'imagePath', recent.image_path,
          'categoryColor', recent.category_color
        ) ORDER BY recent.created_at DESC, recent.id DESC
      ),
      '[]'::jsonb
    ) AS items
    FROM (
      SELECT *
      FROM own_words
      ORDER BY created_at DESC, id DESC
      LIMIT 10
    ) AS recent
  )
  SELECT jsonb_build_object(
    'total', stats.total,
    'mastered', stats.mastered,
    'learning', stats.learning,
    'recentWords', recent_words.items
  )
  FROM stats
  CROSS JOIN recent_words;
$$;

REVOKE ALL PRIVILEGES
  ON FUNCTION public.get_dashboard_vocabulary_overview()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
  ON FUNCTION public.get_dashboard_vocabulary_overview()
  TO authenticated;
