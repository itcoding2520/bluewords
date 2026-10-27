CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (btrim(title) <> ''),
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  questions jsonb NOT NULL CHECK (jsonb_typeof(questions) = 'array' AND jsonb_array_length(questions) = 10),
  due_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.assessment_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, user_id)
);

CREATE TABLE public.assessment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES public.assessment_recipients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL CHECK (attempt_number > 0),
  questions jsonb NOT NULL CHECK (jsonb_typeof(questions) = 'array' AND jsonb_array_length(questions) = 10),
  answers jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(answers) = 'array'),
  score integer CHECK (score IS NULL OR score BETWEEN 0 AND 100),
  correct_count integer CHECK (correct_count IS NULL OR correct_count BETWEEN 0 AND 10),
  elapsed_seconds integer CHECK (elapsed_seconds IS NULL OR elapsed_seconds >= 0),
  result text CHECK (result IS NULL OR result IN ('passed', 'failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (recipient_id, attempt_number)
);

CREATE INDEX assessment_recipients_user_status_idx ON public.assessment_recipients(user_id, status, assigned_at DESC);
CREATE INDEX assessment_attempts_user_completed_idx ON public.assessment_attempts(user_id, completed_at DESC);

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.assessments, public.assessment_recipients, public.assessment_attempts FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.assessments, public.assessment_recipients, public.assessment_attempts TO service_role;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check
  CHECK (kind IN ('publish_request', 'publish_approved', 'publish_rejected', 'admin_message', 'assessment_assigned'));
