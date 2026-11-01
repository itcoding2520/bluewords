-- Keep the daily-routines Easy vocabulary bank at 20 distinct words.
UPDATE public.communication_lesson_items
SET content_en = 'alarm', meaning_vi = 'đồng hồ báo thức', updated_at = now()
WHERE item_key = 'phase6-daily-routines-easy-word-10';
