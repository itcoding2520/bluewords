CREATE TABLE IF NOT EXISTS public.communication_learning_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  learning_goal text NOT NULL CHECK (learning_goal IN ('games', 'conversation')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.communication_learning_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Learners manage own communication learning preferences" ON public.communication_learning_preferences;
CREATE POLICY "Learners manage own communication learning preferences"
  ON public.communication_learning_preferences
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.communication_learning_preferences TO authenticated;
