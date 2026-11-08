-- Keep assigned tests and learner results when the admin who created them is
-- removed. The assessment remains usable, but no longer has an author account.
ALTER TABLE public.assessments
  ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE public.assessments
  DROP CONSTRAINT IF EXISTS assessments_created_by_fkey,
  ADD CONSTRAINT assessments_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
