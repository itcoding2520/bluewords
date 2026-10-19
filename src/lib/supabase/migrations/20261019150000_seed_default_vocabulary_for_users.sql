-- Seed the starter category set and 90-word Vietnamese vocabulary pack for new accounts.
-- Existing empty accounts receive the same pack once when this migration is applied.
CREATE OR REPLACE FUNCTION public.seed_starter_vocabulary_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_words jsonb := '[{"word":"apple","type":"word","part_of_speech":"noun","meaning":"quả táo","category":"Fruits","status":"learning","ipa":null},{"word":"banana","type":"word","part_of_speech":"noun","meaning":"quả chuối","category":"Fruits","status":"learning","ipa":null},{"word":"orange","type":"word","part_of_speech":"noun","meaning":"quả cam","category":"Fruits","status":"learning","ipa":null},{"word":"mango","type":"word","part_of_speech":"noun","meaning":"quả xoài","category":"Fruits","status":"learning","ipa":null},{"word":"grape","type":"word","part_of_speech":"noun","meaning":"quả nho","category":"Fruits","status":"learning","ipa":null},{"word":"red","type":"word","part_of_speech":"adjective","meaning":"màu đỏ","category":"Colors","status":"learning","ipa":null},{"word":"blue","type":"word","part_of_speech":"adjective","meaning":"màu xanh dương","category":"Colors","status":"learning","ipa":null},{"word":"green","type":"word","part_of_speech":"adjective","meaning":"màu xanh lá cây","category":"Colors","status":"learning","ipa":null},{"word":"yellow","type":"word","part_of_speech":"adjective","meaning":"màu vàng","category":"Colors","status":"learning","ipa":null},{"word":"black","type":"word","part_of_speech":"adjective","meaning":"màu đen","category":"Colors","status":"learning","ipa":null},{"word":"cat","type":"word","part_of_speech":"noun","meaning":"con mèo","category":"Animals","status":"learning","ipa":null},{"word":"dog","type":"word","part_of_speech":"noun","meaning":"con chó","category":"Animals","status":"learning","ipa":null},{"word":"bird","type":"word","part_of_speech":"noun","meaning":"con chim","category":"Animals","status":"learning","ipa":null},{"word":"fish","type":"word","part_of_speech":"noun","meaning":"con cá","category":"Animals","status":"learning","ipa":null},{"word":"horse","type":"word","part_of_speech":"noun","meaning":"con ngựa","category":"Animals","status":"learning","ipa":null},{"word":"mother","type":"word","part_of_speech":"noun","meaning":"mẹ","category":"Family","status":"learning","ipa":null},{"word":"father","type":"word","part_of_speech":"noun","meaning":"bố; cha","category":"Family","status":"learning","ipa":null},{"word":"sister","type":"word","part_of_speech":"noun","meaning":"chị; em gái","category":"Family","status":"learning","ipa":null},{"word":"brother","type":"word","part_of_speech":"noun","meaning":"anh; em trai","category":"Family","status":"learning","ipa":null},{"word":"child","type":"word","part_of_speech":"noun","meaning":"trẻ em; con","category":"Family","status":"learning","ipa":null},{"word":"head","type":"word","part_of_speech":"noun","meaning":"đầu","category":"Body Parts","status":"learning","ipa":null},{"word":"eye","type":"word","part_of_speech":"noun","meaning":"mắt","category":"Body Parts","status":"learning","ipa":null},{"word":"ear","type":"word","part_of_speech":"noun","meaning":"tai","category":"Body Parts","status":"learning","ipa":null},{"word":"nose","type":"word","part_of_speech":"noun","meaning":"mũi","category":"Body Parts","status":"learning","ipa":null},{"word":"mouth","type":"word","part_of_speech":"noun","meaning":"miệng","category":"Body Parts","status":"learning","ipa":null},{"word":"pencil","type":"word","part_of_speech":"noun","meaning":"bút chì","category":"School Supplies","status":"learning","ipa":null},{"word":"pen","type":"word","part_of_speech":"noun","meaning":"bút mực","category":"School Supplies","status":"learning","ipa":null},{"word":"eraser","type":"word","part_of_speech":"noun","meaning":"cục tẩy","category":"School Supplies","status":"learning","ipa":null},{"word":"ruler","type":"word","part_of_speech":"noun","meaning":"thước kẻ","category":"School Supplies","status":"learning","ipa":null},{"word":"notebook","type":"word","part_of_speech":"noun","meaning":"vở; sổ tay","category":"School Supplies","status":"learning","ipa":null},{"word":"car","type":"word","part_of_speech":"noun","meaning":"ô tô; xe hơi","category":"Time","status":"learning","ipa":null},{"word":"bus","type":"word","part_of_speech":"noun","meaning":"xe buýt","category":"Time","status":"learning","ipa":null},{"word":"bicycle","type":"word","part_of_speech":"noun","meaning":"xe đạp","category":"Time","status":"learning","ipa":null},{"word":"motorcycle","type":"word","part_of_speech":"noun","meaning":"xe máy","category":"Time","status":"learning","ipa":null},{"word":"train","type":"word","part_of_speech":"noun","meaning":"tàu hỏa","category":"Time","status":"learning","ipa":null},{"word":"sunny","type":"word","part_of_speech":"adjective","meaning":"có nắng; trời nắng","category":"Weather","status":"learning","ipa":null},{"word":"rainy","type":"word","part_of_speech":"adjective","meaning":"có mưa; trời mưa","category":"Weather","status":"learning","ipa":null},{"word":"cloudy","type":"word","part_of_speech":"adjective","meaning":"nhiều mây","category":"Weather","status":"learning","ipa":null},{"word":"windy","type":"word","part_of_speech":"adjective","meaning":"có gió","category":"Weather","status":"learning","ipa":null},{"word":"snowy","type":"word","part_of_speech":"adjective","meaning":"có tuyết","category":"Weather","status":"learning","ipa":null},{"word":"shirt","type":"word","part_of_speech":"noun","meaning":"áo sơ mi","category":"Clothes","status":"learning","ipa":null},{"word":"pants","type":"word","part_of_speech":"noun","meaning":"quần dài","category":"Clothes","status":"learning","ipa":null},{"word":"dress","type":"word","part_of_speech":"noun","meaning":"váy liền; đầm","category":"Clothes","status":"learning","ipa":null},{"word":"shoes","type":"word","part_of_speech":"noun","meaning":"giày","category":"Clothes","status":"learning","ipa":null},{"word":"jacket","type":"word","part_of_speech":"noun","meaning":"áo khoác","category":"Clothes","status":"learning","ipa":null},{"word":"one","type":"word","part_of_speech":"","meaning":"số một; một","category":"Numbers","status":"learning","ipa":null},{"word":"two","type":"word","part_of_speech":"","meaning":"số hai; hai","category":"Numbers","status":"learning","ipa":null},{"word":"three","type":"word","part_of_speech":"","meaning":"số ba; ba","category":"Numbers","status":"learning","ipa":null},{"word":"four","type":"word","part_of_speech":"","meaning":"số bốn; bốn","category":"Numbers","status":"learning","ipa":null},{"word":"five","type":"word","part_of_speech":"","meaning":"số năm; năm","category":"Numbers","status":"learning","ipa":null},{"word":"teacher","type":"word","part_of_speech":"noun","meaning":"giáo viên","category":"School","status":"learning","ipa":null},{"word":"student","type":"word","part_of_speech":"noun","meaning":"học sinh; sinh viên","category":"School","status":"learning","ipa":null},{"word":"classroom","type":"word","part_of_speech":"noun","meaning":"lớp học","category":"School","status":"learning","ipa":null},{"word":"lesson","type":"word","part_of_speech":"noun","meaning":"bài học","category":"School","status":"learning","ipa":null},{"word":"homework","type":"word","part_of_speech":"noun","meaning":"bài tập về nhà","category":"School","status":"learning","ipa":null},{"word":"house","type":"word","part_of_speech":"noun","meaning":"ngôi nhà","category":"House","status":"learning","ipa":null},{"word":"room","type":"word","part_of_speech":"noun","meaning":"căn phòng","category":"House","status":"learning","ipa":null},{"word":"kitchen","type":"word","part_of_speech":"noun","meaning":"nhà bếp","category":"House","status":"learning","ipa":null},{"word":"bathroom","type":"word","part_of_speech":"noun","meaning":"phòng tắm; nhà vệ sinh","category":"House","status":"learning","ipa":null},{"word":"bedroom","type":"word","part_of_speech":"noun","meaning":"phòng ngủ","category":"House","status":"learning","ipa":null},{"word":"circle","type":"word","part_of_speech":"noun","meaning":"hình tròn","category":"Shapes","status":"learning","ipa":null},{"word":"square","type":"word","part_of_speech":"noun","meaning":"hình vuông","category":"Shapes","status":"learning","ipa":null},{"word":"triangle","type":"word","part_of_speech":"noun","meaning":"hình tam giác","category":"Shapes","status":"learning","ipa":null},{"word":"rectangle","type":"word","part_of_speech":"noun","meaning":"hình chữ nhật","category":"Shapes","status":"learning","ipa":null},{"word":"star","type":"word","part_of_speech":"noun","meaning":"hình ngôi sao","category":"Shapes","status":"learning","ipa":null},{"word":"rice","type":"word","part_of_speech":"noun","meaning":"cơm; gạo","category":"Food","status":"learning","ipa":null},{"word":"bread","type":"word","part_of_speech":"noun","meaning":"bánh mì","category":"Food","status":"learning","ipa":null},{"word":"egg","type":"word","part_of_speech":"noun","meaning":"trứng","category":"Food","status":"learning","ipa":null},{"word":"chicken","type":"word","part_of_speech":"noun","meaning":"thịt gà; con gà","category":"Food","status":"learning","ipa":null},{"word":"soup","type":"word","part_of_speech":"noun","meaning":"súp; canh","category":"Food","status":"learning","ipa":null},{"word":"doctor","type":"word","part_of_speech":"noun","meaning":"bác sĩ","category":"Jobs","status":"learning","ipa":null},{"word":"nurse","type":"word","part_of_speech":"noun","meaning":"y tá","category":"Jobs","status":"learning","ipa":null},{"word":"engineer","type":"word","part_of_speech":"noun","meaning":"kỹ sư","category":"Jobs","status":"learning","ipa":null},{"word":"chef","type":"word","part_of_speech":"noun","meaning":"đầu bếp","category":"Jobs","status":"learning","ipa":null},{"word":"farmer","type":"word","part_of_speech":"noun","meaning":"nông dân","category":"Jobs","status":"learning","ipa":null},{"word":"ticket","type":"word","part_of_speech":"noun","meaning":"vé","category":"Transport","status":"learning","ipa":null},{"word":"station","type":"word","part_of_speech":"noun","meaning":"nhà ga; trạm","category":"Transport","status":"learning","ipa":null},{"word":"airport","type":"word","part_of_speech":"noun","meaning":"sân bay","category":"Transport","status":"learning","ipa":null},{"word":"traffic","type":"word","part_of_speech":"noun","meaning":"giao thông; xe cộ","category":"Transport","status":"learning","ipa":null},{"word":"journey","type":"word","part_of_speech":"noun","meaning":"chuyến đi","category":"Transport","status":"learning","ipa":null},{"word":"happy","type":"word","part_of_speech":"adjective","meaning":"vui vẻ; hạnh phúc","category":"Feelings","status":"learning","ipa":null},{"word":"sad","type":"word","part_of_speech":"adjective","meaning":"buồn","category":"Feelings","status":"learning","ipa":null},{"word":"angry","type":"word","part_of_speech":"adjective","meaning":"tức giận","category":"Feelings","status":"learning","ipa":null},{"word":"afraid","type":"word","part_of_speech":"adjective","meaning":"sợ hãi","category":"Feelings","status":"learning","ipa":null},{"word":"excited","type":"word","part_of_speech":"adjective","meaning":"hào hứng; phấn khích","category":"Feelings","status":"learning","ipa":null},{"word":"run","type":"word","part_of_speech":"verb","meaning":"chạy","category":"Actions","status":"learning","ipa":null},{"word":"walk","type":"word","part_of_speech":"verb","meaning":"đi bộ","category":"Actions","status":"learning","ipa":null},{"word":"eat","type":"word","part_of_speech":"verb","meaning":"ăn","category":"Actions","status":"learning","ipa":null},{"word":"drink","type":"word","part_of_speech":"verb","meaning":"uống","category":"Actions","status":"learning","ipa":null},{"word":"sleep","type":"word","part_of_speech":"verb","meaning":"ngủ","category":"Actions","status":"learning","ipa":null}]'::jsonb;
  v_item jsonb;
  v_word_id uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'A user ID is required to seed starter vocabulary.';
  END IF;

  INSERT INTO public.vocabulary_categories (user_id, name, color, is_default)
  VALUES
    (p_user_id, 'Uncategorized', 'blue', true),
    (p_user_id, 'Daily', 'blue', false),
    (p_user_id, 'Work', 'orange', false),
    (p_user_id, 'Frontend', 'violet', false),
    (p_user_id, 'Fruits', 'green', false),
    (p_user_id, 'Colors', 'violet', false),
    (p_user_id, 'Animals', 'orange', false),
    (p_user_id, 'Family', 'rose', false),
    (p_user_id, 'Body Parts', 'blue', false),
    (p_user_id, 'School Supplies', 'violet', false),
    (p_user_id, 'Time', 'orange', false),
    (p_user_id, 'Weather', 'blue', false),
    (p_user_id, 'Clothes', 'rose', false),
    (p_user_id, 'Numbers', 'green', false),
    (p_user_id, 'School', 'blue', false),
    (p_user_id, 'House', 'orange', false),
    (p_user_id, 'Shapes', 'violet', false),
    (p_user_id, 'Food', 'green', false),
    (p_user_id, 'Jobs', 'blue', false),
    (p_user_id, 'Transport', 'orange', false),
    (p_user_id, 'Feelings', 'rose', false),
    (p_user_id, 'Actions', 'violet', false)
  ON CONFLICT DO NOTHING;

  -- Do not overwrite or augment an account that already has its own vocabulary.
  IF EXISTS (
    SELECT 1 FROM public.vocabulary_words WHERE user_id = p_user_id
  ) THEN
    RETURN;
  END IF;

  FOR v_item IN
    SELECT value FROM pg_catalog.jsonb_array_elements(v_words) AS items(value)
  LOOP
    INSERT INTO public.vocabulary_words (
      user_id, word, meaning, category, status, type, ipa
    )
    VALUES (
      p_user_id,
      v_item->>'word',
      v_item->>'meaning',
      COALESCE(
        (
          SELECT categories.name
          FROM public.vocabulary_categories AS categories
          WHERE categories.user_id = p_user_id
            AND pg_catalog.lower(categories.name) = pg_catalog.lower(v_item->>'category')
          LIMIT 1
        ),
        v_item->>'category'
      ),
      v_item->>'status',
      v_item->>'type',
      NULLIF(v_item->>'ipa', '')
    )
    RETURNING id INTO v_word_id;

    IF NULLIF(v_item->>'part_of_speech', '') IS NOT NULL THEN
      INSERT INTO public.vocabulary_meanings (
        vocabulary_word_id, part_of_speech, meaning
      )
      VALUES (
        v_word_id,
        v_item->>'part_of_speech',
        v_item->>'meaning'
      );
    END IF;
  END LOOP;
END;
$$;
REVOKE ALL PRIVILEGES
  ON FUNCTION public.seed_starter_vocabulary_for_user(uuid)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_default_vocabulary_categories_for_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_starter_vocabulary_for_user(NEW.id);
  RETURN NEW;
END;
$$;
-- Backfill users who have no vocabulary yet. Existing user-created data is untouched.
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  FOR v_user_id IN
    SELECT users.id
    FROM auth.users AS users
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.vocabulary_words AS words
      WHERE words.user_id = users.id
    )
  LOOP
    PERFORM public.seed_starter_vocabulary_for_user(v_user_id);
  END LOOP;
END;
$$;
