CREATE TABLE IF NOT EXISTS public.communication_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title_en text NOT NULL,
  title_vi text NOT NULL,
  description_en text NOT NULL DEFAULT '',
  description_vi text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.communication_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_key text NOT NULL UNIQUE CHECK (length(trim(lesson_key)) BETWEEN 2 AND 80),
  topic_id uuid NOT NULL REFERENCES public.communication_topics(id) ON DELETE CASCADE,
  title_en text NOT NULL,
  title_vi text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.communication_lesson_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_key text NOT NULL UNIQUE CHECK (length(trim(item_key)) BETWEEN 2 AND 100),
  lesson_id uuid NOT NULL REFERENCES public.communication_lessons(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('word', 'phrase', 'sentence_pattern')),
  content_en text NOT NULL,
  meaning_vi text NOT NULL,
  example_en text NOT NULL DEFAULT '',
  example_vi text NOT NULL DEFAULT '',
  image_keyword text NOT NULL DEFAULT '',
  audio_url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.communication_dialogues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dialogue_key text NOT NULL UNIQUE CHECK (length(trim(dialogue_key)) BETWEEN 2 AND 100),
  lesson_id uuid NOT NULL REFERENCES public.communication_lessons(id) ON DELETE CASCADE,
  title_en text NOT NULL,
  title_vi text NOT NULL DEFAULT '',
  prompt_vi text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.communication_dialogue_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turn_key text NOT NULL UNIQUE CHECK (length(trim(turn_key)) BETWEEN 2 AND 120),
  dialogue_id uuid NOT NULL REFERENCES public.communication_dialogues(id) ON DELETE CASCADE,
  turn_order integer NOT NULL CHECK (turn_order > 0),
  speaker text NOT NULL,
  text_en text NOT NULL,
  meaning_vi text NOT NULL DEFAULT '',
  audio_url text NOT NULL DEFAULT '',
  response_prompt_vi text NOT NULL DEFAULT '',
  expected_response text NOT NULL DEFAULT '',
  response_options jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(response_options) = 'array'),
  UNIQUE (dialogue_id, turn_order)
);

CREATE TABLE IF NOT EXISTS public.communication_lesson_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.communication_lessons(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_items integer NOT NULL DEFAULT 0 CHECK (completed_items >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS public.communication_item_reviews (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.communication_lesson_items(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'learning' CHECK (status IN ('learning', 'mastered')),
  review_count integer NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  correct_count integer NOT NULL DEFAULT 0 CHECK (correct_count >= 0 AND correct_count <= review_count),
  last_reviewed_at timestamptz,
  due_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.communication_daily_goals (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  lessons_per_day integer NOT NULL DEFAULT 1 CHECK (lessons_per_day BETWEEN 1 AND 20),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS communication_lessons_topic_idx ON public.communication_lessons (topic_id, status, difficulty, sort_order);
CREATE INDEX IF NOT EXISTS communication_items_lesson_idx ON public.communication_lesson_items (lesson_id, sort_order);
CREATE INDEX IF NOT EXISTS communication_dialogues_lesson_idx ON public.communication_dialogues (lesson_id, sort_order);
CREATE INDEX IF NOT EXISTS communication_turns_dialogue_idx ON public.communication_dialogue_turns (dialogue_id, turn_order);
CREATE INDEX IF NOT EXISTS communication_progress_user_status_idx ON public.communication_lesson_progress (user_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS communication_item_reviews_due_idx ON public.communication_item_reviews (user_id, status, due_at);

ALTER TABLE public.communication_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_lesson_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_dialogues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_dialogue_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_item_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_daily_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read published communication topics" ON public.communication_topics;
CREATE POLICY "Read published communication topics" ON public.communication_topics FOR SELECT TO anon, authenticated
  USING (status = 'published' OR (SELECT auth.uid()) IN (SELECT user_id FROM public.app_admins));
DROP POLICY IF EXISTS "Admins manage communication topics" ON public.communication_topics;
CREATE POLICY "Admins manage communication topics" ON public.communication_topics FOR ALL TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT user_id FROM public.app_admins))
  WITH CHECK ((SELECT auth.uid()) IN (SELECT user_id FROM public.app_admins));

DROP POLICY IF EXISTS "Read published communication lessons" ON public.communication_lessons;
CREATE POLICY "Read published communication lessons" ON public.communication_lessons FOR SELECT TO anon, authenticated
  USING (
    (status = 'published' AND EXISTS (
      SELECT 1 FROM public.communication_topics topic
      WHERE topic.id = topic_id AND topic.status = 'published'
    ))
    OR (SELECT auth.uid()) IN (SELECT user_id FROM public.app_admins)
  );
DROP POLICY IF EXISTS "Admins manage communication lessons" ON public.communication_lessons;
CREATE POLICY "Admins manage communication lessons" ON public.communication_lessons FOR ALL TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT user_id FROM public.app_admins))
  WITH CHECK ((SELECT auth.uid()) IN (SELECT user_id FROM public.app_admins));

DROP POLICY IF EXISTS "Read published communication lesson items" ON public.communication_lesson_items;
CREATE POLICY "Read published communication lesson items" ON public.communication_lesson_items FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.communication_lessons lesson
      JOIN public.communication_topics topic ON topic.id = lesson.topic_id
      WHERE lesson.id = lesson_id AND lesson.status = 'published' AND topic.status = 'published'
    )
    OR (SELECT auth.uid()) IN (SELECT user_id FROM public.app_admins)
  );
DROP POLICY IF EXISTS "Admins manage communication lesson items" ON public.communication_lesson_items;
CREATE POLICY "Admins manage communication lesson items" ON public.communication_lesson_items FOR ALL TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT user_id FROM public.app_admins))
  WITH CHECK ((SELECT auth.uid()) IN (SELECT user_id FROM public.app_admins));

DROP POLICY IF EXISTS "Read published communication dialogues" ON public.communication_dialogues;
CREATE POLICY "Read published communication dialogues" ON public.communication_dialogues FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.communication_lessons lesson
      JOIN public.communication_topics topic ON topic.id = lesson.topic_id
      WHERE lesson.id = lesson_id AND lesson.status = 'published' AND topic.status = 'published'
    )
    OR (SELECT auth.uid()) IN (SELECT user_id FROM public.app_admins)
  );
DROP POLICY IF EXISTS "Admins manage communication dialogues" ON public.communication_dialogues;
CREATE POLICY "Admins manage communication dialogues" ON public.communication_dialogues FOR ALL TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT user_id FROM public.app_admins))
  WITH CHECK ((SELECT auth.uid()) IN (SELECT user_id FROM public.app_admins));

DROP POLICY IF EXISTS "Read published communication dialogue turns" ON public.communication_dialogue_turns;
CREATE POLICY "Read published communication dialogue turns" ON public.communication_dialogue_turns FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.communication_dialogues dialogue
      JOIN public.communication_lessons lesson ON lesson.id = dialogue.lesson_id
      JOIN public.communication_topics topic ON topic.id = lesson.topic_id
      WHERE dialogue.id = dialogue_id AND lesson.status = 'published' AND topic.status = 'published'
    )
    OR (SELECT auth.uid()) IN (SELECT user_id FROM public.app_admins)
  );
DROP POLICY IF EXISTS "Admins manage communication dialogue turns" ON public.communication_dialogue_turns;
CREATE POLICY "Admins manage communication dialogue turns" ON public.communication_dialogue_turns FOR ALL TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT user_id FROM public.app_admins))
  WITH CHECK ((SELECT auth.uid()) IN (SELECT user_id FROM public.app_admins));

DROP POLICY IF EXISTS "Learners manage own communication progress" ON public.communication_lesson_progress;
CREATE POLICY "Learners manage own communication progress" ON public.communication_lesson_progress FOR ALL TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.communication_lessons lesson
      JOIN public.communication_topics topic ON topic.id = lesson.topic_id
      WHERE lesson.id = lesson_id AND lesson.status = 'published' AND topic.status = 'published'
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.communication_lessons lesson
      JOIN public.communication_topics topic ON topic.id = lesson.topic_id
      WHERE lesson.id = lesson_id AND lesson.status = 'published' AND topic.status = 'published'
    )
  );

DROP POLICY IF EXISTS "Learners manage own communication item reviews" ON public.communication_item_reviews;
CREATE POLICY "Learners manage own communication item reviews" ON public.communication_item_reviews FOR ALL TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.communication_lesson_items item
      JOIN public.communication_lessons lesson ON lesson.id = item.lesson_id
      JOIN public.communication_topics topic ON topic.id = lesson.topic_id
      WHERE item.id = item_id AND lesson.status = 'published' AND topic.status = 'published'
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.communication_lesson_items item
      JOIN public.communication_lessons lesson ON lesson.id = item.lesson_id
      JOIN public.communication_topics topic ON topic.id = lesson.topic_id
      WHERE item.id = item_id AND lesson.status = 'published' AND topic.status = 'published'
    )
  );

DROP POLICY IF EXISTS "Learners manage own communication daily goal" ON public.communication_daily_goals;
CREATE POLICY "Learners manage own communication daily goal" ON public.communication_daily_goals FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

GRANT SELECT ON public.communication_topics, public.communication_lessons, public.communication_lesson_items,
  public.communication_dialogues, public.communication_dialogue_turns TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.communication_topics, public.communication_lessons,
  public.communication_lesson_items, public.communication_dialogues, public.communication_dialogue_turns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communication_lesson_progress,
  public.communication_item_reviews, public.communication_daily_goals TO authenticated;

INSERT INTO public.communication_topics (slug, title_en, title_vi, description_en, description_vi, sort_order, status)
VALUES
  ('greetings-introductions', 'Greetings and introductions', 'Chào hỏi và làm quen', 'Start a conversation and introduce yourself.', 'Bắt đầu cuộc trò chuyện và giới thiệu bản thân.', 1, 'published'),
  ('family-friends', 'Family and friends', 'Gia đình và bạn bè', 'Talk about people close to you.', 'Nói về những người thân thiết với bạn.', 2, 'published'),
  ('daily-routines', 'Daily routines', 'Thói quen hằng ngày', 'Describe everyday activities and habits.', 'Miêu tả hoạt động và thói quen hằng ngày.', 3, 'published'),
  ('work-colleagues', 'Work and colleagues', 'Công việc và đồng nghiệp', 'Communicate with coworkers and at work.', 'Giao tiếp với đồng nghiệp và trong công việc.', 4, 'published'),
  ('food-restaurants', 'Food and restaurants', 'Đồ ăn và nhà hàng', 'Order food, ask about a menu, and make reservations.', 'Gọi món, hỏi về thực đơn và đặt bàn.', 5, 'published'),
  ('shopping-payments', 'Shopping and payments', 'Mua sắm và thanh toán', 'Find products, ask prices, and pay.', 'Tìm sản phẩm, hỏi giá và thanh toán.', 6, 'published'),
  ('transport-directions', 'Transportation and directions', 'Đi lại và hỏi đường', 'Get around and ask for directions.', 'Di chuyển và hỏi đường.', 7, 'published'),
  ('travel-hotels', 'Travel and hotels', 'Du lịch và khách sạn', 'Handle common travel and hotel situations.', 'Xử lý các tình huống du lịch và khách sạn.', 8, 'published'),
  ('health-feelings', 'Health and feelings', 'Sức khỏe và cảm xúc', 'Describe how you feel and ask for help.', 'Miêu tả tình trạng và hỏi trợ giúp.', 9, 'published'),
  ('hobbies-free-time', 'Hobbies and free time', 'Sở thích và thời gian rảnh', 'Talk about interests and plans.', 'Nói về sở thích và dự định.', 10, 'published'),
  ('time-appointments', 'Time and appointments', 'Thời gian và lịch hẹn', 'Arrange plans, times, and appointments.', 'Sắp xếp kế hoạch, thời gian và lịch hẹn.', 11, 'published'),
  ('phone-online', 'Phone and online communication', 'Điện thoại và giao tiếp trực tuyến', 'Communicate by phone, message, and online.', 'Giao tiếp qua điện thoại, tin nhắn và trực tuyến.', 12, 'published')
ON CONFLICT (slug) DO NOTHING;

