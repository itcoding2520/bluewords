DROP POLICY IF EXISTS "Anyone can read active sentence builder questions" ON public.sentence_builder_questions;
CREATE POLICY "Signed-in users read active sentence builder questions"
  ON public.sentence_builder_questions
  FOR SELECT
  TO authenticated
  USING (is_active OR (SELECT auth.uid()) IN (SELECT user_id FROM public.app_admins));

REVOKE SELECT ON public.sentence_builder_questions FROM anon;
GRANT SELECT ON public.sentence_builder_questions TO authenticated;
