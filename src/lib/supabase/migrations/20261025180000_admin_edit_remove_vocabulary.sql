-- Only admins can edit starter/published shared content. Owners may continue
-- editing their own unpublished requests under the existing owner policies.
CREATE POLICY "Admins can remove community categories"
  ON public.community_categories FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Admins can remove community words"
  ON public.community_words FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = (SELECT auth.uid())));
