ALTER TABLE public.vocabulary_categories
  DROP CONSTRAINT IF EXISTS vocabulary_categories_color_check;

ALTER TABLE public.vocabulary_categories
  ADD CONSTRAINT vocabulary_categories_color_check
  CHECK (
    color IN (
      'blue',
      'violet',
      'orange',
      'green',
      'rose',
      'indigo',
      'teal',
      'amber',
      'pink',
      'slate'
    )
  );
