CREATE TABLE IF NOT EXISTS public.sentence_builder_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id text NOT NULL UNIQUE,
  difficulty text NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  category text NOT NULL,
  prompt_vi text NOT NULL,
  answer_sentence text NOT NULL,
  answer_tokens jsonb NOT NULL CHECK (jsonb_typeof(answer_tokens) = 'array' AND jsonb_array_length(answer_tokens) >= 2),
  distractor_tokens jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(distractor_tokens) = 'array'),
  image_keyword text NOT NULL DEFAULT '',
  vocabulary_words text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sentence_builder_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read active sentence builder questions" ON public.sentence_builder_questions;
CREATE POLICY "Anyone can read active sentence builder questions" ON public.sentence_builder_questions FOR SELECT TO anon, authenticated USING (is_active OR (SELECT auth.uid()) IN (SELECT user_id FROM public.app_admins));
DROP POLICY IF EXISTS "Admins manage sentence builder questions" ON public.sentence_builder_questions;
CREATE POLICY "Admins manage sentence builder questions" ON public.sentence_builder_questions FOR ALL TO authenticated USING ((SELECT auth.uid()) IN (SELECT user_id FROM public.app_admins)) WITH CHECK ((SELECT auth.uid()) IN (SELECT user_id FROM public.app_admins));
GRANT SELECT ON public.sentence_builder_questions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sentence_builder_questions TO authenticated;
CREATE INDEX IF NOT EXISTS sentence_builder_questions_game_idx ON public.sentence_builder_questions (is_active, difficulty, category);

INSERT INTO public.sentence_builder_questions (question_id,difficulty,category,prompt_vi,answer_sentence,answer_tokens,distractor_tokens,image_keyword,vocabulary_words) VALUES
  ('SB001', 'easy', 'animals', 'Tôi nhìn thấy một con mèo.', 'I see a cat.', '["I", "see", "a", "cat."]'::jsonb, '["dog", "big"]'::jsonb, 'cat', ARRAY['I', 'see', 'cat']::text[]),
  ('SB002', 'easy', 'animals', 'Con chó to.', 'The dog is big.', '["The", "dog", "is", "big."]'::jsonb, '["small", "cat"]'::jsonb, 'dog', ARRAY['dog', 'big']::text[]),
  ('SB003', 'easy', 'animals', 'Mèo của tôi thích sữa.', 'My cat likes milk.', '["My", "cat", "likes", "milk."]'::jsonb, '["dog", "water"]'::jsonb, 'cat', ARRAY['cat', 'like', 'milk']::text[]),
  ('SB004', 'easy', 'animals', 'Con chim có thể bay.', 'The bird can fly.', '["The", "bird", "can", "fly."]'::jsonb, '["swim", "fish"]'::jsonb, 'bird', ARRAY['bird', 'can', 'fly']::text[]),
  ('SB005', 'easy', 'animals', 'Con cá bơi trong nước.', 'The fish swims in water.', '["The", "fish", "swims", "in", "water."]'::jsonb, '["bird", "tree"]'::jsonb, 'fish', ARRAY['fish', 'swim', 'water']::text[]),
  ('SB006', 'easy', 'animals', 'Một con thỏ ăn cà rốt.', 'A rabbit eats a carrot.', '["A", "rabbit", "eats", "a", "carrot."]'::jsonb, '["apple", "run"]'::jsonb, 'rabbit', ARRAY['rabbit', 'eat', 'carrot']::text[]),
  ('SB007', 'easy', 'animals', 'Con khỉ có một quả chuối.', 'The monkey has a banana.', '["The", "monkey", "has", "a", "banana."]'::jsonb, '["apple", "blue"]'::jsonb, 'monkey', ARRAY['monkey', 'have', 'banana']::text[]),
  ('SB008', 'easy', 'animals', 'Con bò cho chúng ta sữa.', 'The cow gives us milk.', '["The", "cow", "gives", "us", "milk."]'::jsonb, '["juice", "fly"]'::jsonb, 'cow', ARRAY['cow', 'give', 'milk']::text[]),
  ('SB009', 'easy', 'animals', 'Con ngựa chạy nhanh.', 'The horse runs fast.', '["The", "horse", "runs", "fast."]'::jsonb, '["slow", "sleep"]'::jsonb, 'horse', ARRAY['horse', 'run', 'fast']::text[]),
  ('SB010', 'easy', 'animals', 'Con vịt màu vàng.', 'The duck is yellow.', '["The", "duck", "is", "yellow."]'::jsonb, '["blue", "green"]'::jsonb, 'duck', ARRAY['duck', 'yellow']::text[]),
  ('SB011', 'easy', 'food', 'Tôi ăn một quả táo.', 'I eat an apple.', '["I", "eat", "an", "apple."]'::jsonb, '["drink", "banana"]'::jsonb, 'apple', ARRAY['eat', 'apple']::text[]),
  ('SB012', 'easy', 'food', 'Cô ấy thích chuối.', 'She likes bananas.', '["She", "likes", "bananas."]'::jsonb, '["orange", "carrot"]'::jsonb, 'banana', ARRAY['like', 'banana']::text[]),
  ('SB013', 'easy', 'food', 'Chúng tôi uống nước mỗi ngày.', 'We drink water every day.', '["We", "drink", "water", "every", "day."]'::jsonb, '["milk", "run"]'::jsonb, 'water', ARRAY['drink', 'water', 'every day']::text[]),
  ('SB014', 'easy', 'food', 'Quả cam ngọt.', 'The orange is sweet.', '["The", "orange", "is", "sweet."]'::jsonb, '["sour", "bread"]'::jsonb, 'orange', ARRAY['orange', 'sweet']::text[]),
  ('SB015', 'easy', 'food', 'Tôi muốn một ít bánh mì.', 'I want some bread.', '["I", "want", "some", "bread."]'::jsonb, '["milk", "book"]'::jsonb, 'bread', ARRAY['want', 'bread']::text[]),
  ('SB016', 'easy', 'colors', 'Cậu ấy có một quả bóng đỏ.', 'He has a red ball.', '["He", "has", "a", "red", "ball."]'::jsonb, '["blue", "small"]'::jsonb, 'red ball', ARRAY['have', 'red', 'ball']::text[]),
  ('SB017', 'easy', 'school', 'Đây là chiếc cặp màu xanh của tôi.', 'This is my blue bag.', '["This", "is", "my", "blue", "bag."]'::jsonb, '["red", "book"]'::jsonb, 'blue bag', ARRAY['blue', 'bag']::text[]),
  ('SB018', 'easy', 'school', 'Quyển sách ở trên bàn học.', 'The book is on the desk.', '["The", "book", "is", "on", "the", "desk."]'::jsonb, '["under", "chair"]'::jsonb, 'book desk', ARRAY['book', 'desk']::text[]),
  ('SB019', 'easy', 'school', 'Bút chì ở trong cặp của tôi.', 'The pencil is in my bag.', '["The", "pencil", "is", "in", "my", "bag."]'::jsonb, '["on", "desk"]'::jsonb, 'pencil bag', ARRAY['pencil', 'bag']::text[]),
  ('SB020', 'easy', 'school', 'Tôi có hai cây bút sáp màu.', 'I have two crayons.', '["I", "have", "two", "crayons."]'::jsonb, '["one", "pencil"]'::jsonb, 'crayon', ARRAY['have', 'two', 'crayons']::text[]),
  ('SB021', 'easy', 'family', 'Mẹ tôi rất tốt bụng.', 'My mother is kind.', '["My", "mother", "is", "kind."]'::jsonb, '["father", "tall"]'::jsonb, 'mother', ARRAY['mother', 'kind']::text[]),
  ('SB022', 'easy', 'family', 'Bố tôi nấu bữa tối.', 'My father cooks dinner.', '["My", "father", "cooks", "dinner."]'::jsonb, '["lunch", "sleep"]'::jsonb, 'father', ARRAY['father', 'cook', 'dinner']::text[]),
  ('SB023', 'easy', 'family', 'Chị/em gái tôi đọc sách.', 'My sister reads a book.', '["My", "sister", "reads", "a", "book."]'::jsonb, '["brother", "run"]'::jsonb, 'sister', ARRAY['sister', 'read', 'book']::text[]),
  ('SB024', 'easy', 'family', 'Em bé đang ngủ.', 'The baby is sleeping.', '["The", "baby", "is", "sleeping."]'::jsonb, '["play", "eat"]'::jsonb, 'baby', ARRAY['baby', 'sleep']::text[]),
  ('SB025', 'easy', 'family', 'Chúng tôi yêu gia đình mình.', 'We love our family.', '["We", "love", "our", "family."]'::jsonb, '["school", "food"]'::jsonb, 'family', ARRAY['love', 'family']::text[]),
  ('SB026', 'easy', 'school', 'Tôi đi học.', 'I go to school.', '["I", "go", "to", "school."]'::jsonb, '["sleep", "home"]'::jsonb, 'school', ARRAY['go', 'school']::text[]),
  ('SB027', 'easy', 'school', 'Cô giáo có một quyển sách.', 'The teacher has a book.', '["The", "teacher", "has", "a", "book."]'::jsonb, '["pencil", "ball"]'::jsonb, 'teacher', ARRAY['teacher', 'book']::text[]),
  ('SB028', 'easy', 'school', 'Tôi viết bằng bút chì.', 'I write with a pencil.', '["I", "write", "with", "a", "pencil."]'::jsonb, '["read", "crayon"]'::jsonb, 'pencil', ARRAY['write', 'pencil']::text[]),
  ('SB029', 'easy', 'actions', 'Chúng tôi chơi ở công viên.', 'We play in the park.', '["We", "play", "in", "the", "park."]'::jsonb, '["school", "sleep"]'::jsonb, 'park', ARRAY['play', 'park']::text[]),
  ('SB030', 'easy', 'school', 'Lớp học sạch sẽ.', 'The classroom is clean.', '["The", "classroom", "is", "clean."]'::jsonb, '["dirty", "big"]'::jsonb, 'classroom', ARRAY['classroom', 'clean']::text[]),
  ('SB031', 'easy', 'weather', 'Hôm nay trời nắng.', 'It is sunny today.', '["It", "is", "sunny", "today."]'::jsonb, '["rainy", "cold"]'::jsonb, 'sunny', ARRAY['sunny', 'today']::text[]),
  ('SB032', 'easy', 'weather', 'Gió lạnh.', 'The wind is cold.', '["The", "wind", "is", "cold."]'::jsonb, '["hot", "sun"]'::jsonb, 'wind', ARRAY['wind', 'cold']::text[]),
  ('SB033', 'easy', 'clothes', 'Tôi mặc áo khoác vào mùa đông.', 'I wear a coat in winter.', '["I", "wear", "a", "coat", "in", "winter."]'::jsonb, '["summer", "shorts"]'::jsonb, 'coat', ARRAY['wear', 'coat', 'winter']::text[]),
  ('SB034', 'easy', 'weather', 'Mưa đang rơi.', 'The rain is falling.', '["The", "rain", "is", "falling."]'::jsonb, '["sun", "fly"]'::jsonb, 'rain', ARRAY['rain', 'fall']::text[]),
  ('SB035', 'easy', 'colors', 'Bầu trời màu xanh.', 'The sky is blue.', '["The", "sky", "is", "blue."]'::jsonb, '["green", "yellow"]'::jsonb, 'sky', ARRAY['sky', 'blue']::text[]),
  ('SB036', 'easy', 'actions', 'Tôi có thể nhảy cao.', 'I can jump high.', '["I", "can", "jump", "high."]'::jsonb, '["low", "swim"]'::jsonb, 'jump', ARRAY['can', 'jump', 'high']::text[]),
  ('SB037', 'easy', 'actions', 'Cô ấy có thể bơi giỏi.', 'She can swim well.', '["She", "can", "swim", "well."]'::jsonb, '["run", "slow"]'::jsonb, 'swim', ARRAY['can', 'swim', 'well']::text[]),
  ('SB038', 'easy', 'transport', 'Cậu ấy chạy đến xe buýt.', 'He runs to the bus.', '["He", "runs", "to", "the", "bus."]'::jsonb, '["car", "walk"]'::jsonb, 'bus', ARRAY['run', 'bus']::text[]),
  ('SB039', 'easy', 'sports', 'Họ cùng chơi bóng đá.', 'They play soccer together.', '["They", "play", "soccer", "together."]'::jsonb, '["tennis", "alone"]'::jsonb, 'soccer', ARRAY['play', 'soccer', 'together']::text[]),
  ('SB040', 'easy', 'transport', 'Tôi đi xe đạp.', 'I ride my bike.', '["I", "ride", "my", "bike."]'::jsonb, '["bus", "walk"]'::jsonb, 'bike', ARRAY['ride', 'bike']::text[]),
  ('SB041', 'medium', 'transport', 'Chiếc ô tô chạy nhanh.', 'The car is fast.', '["The", "car", "is", "fast."]'::jsonb, '["slow", "train"]'::jsonb, 'car', ARRAY['car', 'fast']::text[]),
  ('SB042', 'medium', 'transport', 'Chúng tôi đi xe buýt đến trường.', 'We take the bus to school.', '["We", "take", "the", "bus", "to", "school."]'::jsonb, '["train", "home"]'::jsonb, 'bus', ARRAY['take', 'bus', 'school']::text[]),
  ('SB043', 'medium', 'transport', 'Tàu hỏa rất dài.', 'The train is long.', '["The", "train", "is", "long."]'::jsonb, '["short", "bus"]'::jsonb, 'train', ARRAY['train', 'long']::text[]),
  ('SB044', 'medium', 'transport', 'Con thuyền ở trên mặt nước.', 'The boat is on the water.', '["The", "boat", "is", "on", "the", "water."]'::jsonb, '["under", "car"]'::jsonb, 'boat', ARRAY['boat', 'water']::text[]),
  ('SB045', 'medium', 'transport', 'Máy bay bay cao.', 'The airplane flies high.', '["The", "airplane", "flies", "high."]'::jsonb, '["low", "boat"]'::jsonb, 'airplane', ARRAY['airplane', 'fly', 'high']::text[]),
  ('SB046', 'medium', 'clothes', 'Giày của tôi còn mới.', 'My shoes are new.', '["My", "shoes", "are", "new."]'::jsonb, '["old", "hat"]'::jsonb, 'shoes', ARRAY['shoes', 'new']::text[]),
  ('SB047', 'medium', 'clothes', 'Tôi mặc áo sơ mi màu vàng.', 'I wear a yellow shirt.', '["I", "wear", "a", "yellow", "shirt."]'::jsonb, '["blue", "shoes"]'::jsonb, 'shirt', ARRAY['wear', 'yellow', 'shirt']::text[]),
  ('SB048', 'medium', 'clothes', 'Váy của cô ấy màu hồng.', 'Her dress is pink.', '["Her", "dress", "is", "pink."]'::jsonb, '["green", "shirt"]'::jsonb, 'dress', ARRAY['dress', 'pink']::text[]),
  ('SB049', 'medium', 'clothes', 'Hãy đội mũ của con.', 'Put on your hat.', '["Put", "on", "your", "hat."]'::jsonb, '["take off", "shoes"]'::jsonb, 'hat', ARRAY['put on', 'hat']::text[]),
  ('SB050', 'medium', 'clothes', 'Đôi tất này sạch.', 'These socks are clean.', '["These", "socks", "are", "clean."]'::jsonb, '["dirty", "shoes"]'::jsonb, 'socks', ARRAY['socks', 'clean']::text[]),
  ('SB051', 'medium', 'body', 'Tôi đánh răng.', 'I brush my teeth.', '["I", "brush", "my", "teeth."]'::jsonb, '["wash", "hands"]'::jsonb, 'teeth', ARRAY['brush', 'teeth']::text[]),
  ('SB052', 'medium', 'body', 'Cô ấy rửa tay.', 'She washes her hands.', '["She", "washes", "her", "hands."]'::jsonb, '["brush", "face"]'::jsonb, 'hands', ARRAY['wash', 'hands']::text[]),
  ('SB053', 'medium', 'body', 'Cậu ấy có đôi mắt màu nâu.', 'He has brown eyes.', '["He", "has", "brown", "eyes."]'::jsonb, '["blue", "hair"]'::jsonb, 'eyes', ARRAY['brown', 'eyes']::text[]),
  ('SB054', 'medium', 'body', 'Tóc tôi màu đen.', 'My hair is black.', '["My", "hair", "is", "black."]'::jsonb, '["brown", "eyes"]'::jsonb, 'hair', ARRAY['hair', 'black']::text[]),
  ('SB055', 'medium', 'body', 'Tôi có hai bàn tay.', 'I have two hands.', '["I", "have", "two", "hands."]'::jsonb, '["one", "feet"]'::jsonb, 'hands', ARRAY['have', 'two', 'hands']::text[]),
  ('SB056', 'medium', 'feelings', 'Hôm nay tôi cảm thấy vui.', 'I feel happy today.', '["I", "feel", "happy", "today."]'::jsonb, '["sad", "angry"]'::jsonb, 'happy', ARRAY['feel', 'happy', 'today']::text[]),
  ('SB057', 'medium', 'feelings', 'Cậu bé mệt rồi.', 'The boy is tired.', '["The", "boy", "is", "tired."]'::jsonb, '["happy", "fast"]'::jsonb, 'boy', ARRAY['boy', 'tired']::text[]),
  ('SB058', 'medium', 'feelings', 'Cô bé đang đói.', 'The girl is hungry.', '["The", "girl", "is", "hungry."]'::jsonb, '["thirsty", "sleepy"]'::jsonb, 'girl', ARRAY['girl', 'hungry']::text[]),
  ('SB059', 'medium', 'feelings', 'Tôi đang khát.', 'I am thirsty.', '["I", "am", "thirsty."]'::jsonb, '["hungry", "tired"]'::jsonb, 'thirsty', ARRAY['I', 'am', 'thirsty']::text[]),
  ('SB060', 'medium', 'feelings', 'Chúng tôi rất hào hứng.', 'We are excited.', '["We", "are", "excited."]'::jsonb, '["sad", "tired"]'::jsonb, 'excited', ARRAY['we', 'are', 'excited']::text[]),
  ('SB061', 'medium', 'home', 'Làm ơn mở cửa ra.', 'Please open the door.', '["Please", "open", "the", "door."]'::jsonb, '["close", "window"]'::jsonb, 'door', ARRAY['please', 'open', 'door']::text[]),
  ('SB062', 'medium', 'home', 'Làm ơn đóng cửa sổ.', 'Close the window, please.', '["Close", "the", "window,", "please."]'::jsonb, '["open", "door"]'::jsonb, 'window', ARRAY['close', 'window', 'please']::text[]),
  ('SB063', 'medium', 'home', 'Đèn đang bật trên bàn.', 'The lamp is on the table.', '["The", "lamp", "is", "on", "the", "table."]'::jsonb, '["under", "bed"]'::jsonb, 'lamp', ARRAY['lamp', 'table']::text[]),
  ('SB064', 'medium', 'home', 'Giường của tôi mềm.', 'My bed is soft.', '["My", "bed", "is", "soft."]'::jsonb, '["hard", "chair"]'::jsonb, 'bed', ARRAY['bed', 'soft']::text[]),
  ('SB065', 'medium', 'home', 'Nhà bếp ấm áp.', 'The kitchen is warm.', '["The", "kitchen", "is", "warm."]'::jsonb, '["cold", "bathroom"]'::jsonb, 'kitchen', ARRAY['kitchen', 'warm']::text[]),
  ('SB066', 'medium', 'family', 'Tôi giúp mẹ.', 'I help my mom.', '["I", "help", "my", "mom."]'::jsonb, '["dad", "play"]'::jsonb, 'mom', ARRAY['help', 'mom']::text[]),
  ('SB067', 'medium', 'nature', 'Bố tưới cây.', 'Dad waters the plants.', '["Dad", "waters", "the", "plants."]'::jsonb, '["flowers", "read"]'::jsonb, 'plants', ARRAY['dad', 'water', 'plants']::text[]),
  ('SB068', 'medium', 'food', 'Chúng tôi làm một chiếc bánh.', 'We make a cake.', '["We", "make", "a", "cake."]'::jsonb, '["eat", "book"]'::jsonb, 'cake', ARRAY['make', 'cake']::text[]),
  ('SB069', 'medium', 'actions', 'Cô ấy hát một bài hát vui.', 'She sings a happy song.', '["She", "sings", "a", "happy", "song."]'::jsonb, '["dance", "sad"]'::jsonb, 'song', ARRAY['sing', 'happy', 'song']::text[]),
  ('SB070', 'medium', 'actions', 'Cậu ấy vẽ một ngôi nhà lớn.', 'He draws a big house.', '["He", "draws", "a", "big", "house."]'::jsonb, '["small", "car"]'::jsonb, 'house', ARRAY['draw', 'big', 'house']::text[]),
  ('SB071', 'medium', 'actions', 'Tôi thích đọc truyện.', 'I like to read stories.', '["I", "like", "to", "read", "stories."]'::jsonb, '["write", "songs"]'::jsonb, 'stories', ARRAY['like', 'read', 'stories']::text[]),
  ('SB072', 'medium', 'feelings', 'Bọn trẻ đang cười.', 'The children are laughing.', '["The", "children", "are", "laughing."]'::jsonb, '["cry", "sleep"]'::jsonb, 'children', ARRAY['children', 'laugh']::text[]),
  ('SB073', 'medium', 'actions', 'Chúng tôi chia sẻ đồ chơi.', 'We share our toys.', '["We", "share", "our", "toys."]'::jsonb, '["break", "books"]'::jsonb, 'toys', ARRAY['share', 'toys']::text[]),
  ('SB074', 'medium', 'family', 'Bạn của tôi rất vui tính.', 'My friend is funny.', '["My", "friend", "is", "funny."]'::jsonb, '["sad", "teacher"]'::jsonb, 'friend', ARRAY['friend', 'funny']::text[]),
  ('SB075', 'medium', 'actions', 'Tôi nói lời cảm ơn.', 'I say thank you.', '["I", "say", "thank", "you."]'::jsonb, '["goodbye", "sorry"]'::jsonb, 'thank you', ARRAY['say', 'thank you']::text[]),
  ('SB076', 'medium', 'food', 'Quả táo này màu đỏ.', 'This apple is red.', '["This", "apple", "is", "red."]'::jsonb, '["green", "sweet"]'::jsonb, 'apple', ARRAY['apple', 'red']::text[]),
  ('SB077', 'medium', 'animals', 'Con mèo ở dưới ghế.', 'The cat is under the chair.', '["The", "cat", "is", "under", "the", "chair."]'::jsonb, '["on", "table"]'::jsonb, 'cat', ARRAY['cat', 'under', 'chair']::text[]),
  ('SB078', 'medium', 'nature', 'Quả bóng ở cạnh chiếc hộp.', 'The ball is next to the box.', '["The", "ball", "is", "next", "to", "the", "box."]'::jsonb, '["under", "chair"]'::jsonb, 'ball', ARRAY['ball', 'next to', 'box']::text[]),
  ('SB079', 'medium', 'nature', 'Con chim ở trong cây.', 'The bird is in the tree.', '["The", "bird", "is", "in", "the", "tree."]'::jsonb, '["under", "water"]'::jsonb, 'bird', ARRAY['bird', 'in', 'tree']::text[]),
  ('SB080', 'medium', 'home', 'Giày của tôi ở cạnh cửa.', 'My shoes are by the door.', '["My", "shoes", "are", "by", "the", "door."]'::jsonb, '["under", "bed"]'::jsonb, 'shoes', ARRAY['shoes', 'by', 'door']::text[]),
  ('SB081', 'medium', 'nature', 'Tôi nhìn thấy ba ngôi sao nhỏ.', 'I see three little stars.', '["I", "see", "three", "little", "stars."]'::jsonb, '["big", "moon"]'::jsonb, 'stars', ARRAY['see', 'three', 'little', 'stars']::text[]),
  ('SB082', 'medium', 'nature', 'Mặt trăng sáng tối nay.', 'The moon is bright tonight.', '["The", "moon", "is", "bright", "tonight."]'::jsonb, '["sun", "dark"]'::jsonb, 'moon', ARRAY['moon', 'bright', 'tonight']::text[]),
  ('SB083', 'medium', 'nature', 'Chúng tôi ngắm những đám mây.', 'We watch the clouds.', '["We", "watch", "the", "clouds."]'::jsonb, '["rain", "sleep"]'::jsonb, 'clouds', ARRAY['watch', 'clouds']::text[]),
  ('SB084', 'hard', 'nature', 'Một bông hoa mọc trong vườn.', 'A flower grows in the garden.', '["A", "flower", "grows", "in", "the", "garden."]'::jsonb, '["tree", "house"]'::jsonb, 'flower', ARRAY['flower', 'grow', 'garden']::text[]),
  ('SB085', 'hard', 'nature', 'Con ong ở trên bông hoa.', 'The bee is on the flower.', '["The", "bee", "is", "on", "the", "flower."]'::jsonb, '["under", "bird"]'::jsonb, 'bee', ARRAY['bee', 'flower']::text[]),
  ('SB086', 'hard', 'nature', 'Tôi tưới cái cây màu xanh.', 'I water the green plant.', '["I", "water", "the", "green", "plant."]'::jsonb, '["red", "flower"]'::jsonb, 'plant', ARRAY['water', 'green', 'plant']::text[]),
  ('SB087', 'hard', 'animals', 'Cô ấy cho chú chó nhỏ ăn.', 'She feeds the small dog.', '["She", "feeds", "the", "small", "dog."]'::jsonb, '["big", "cat"]'::jsonb, 'dog', ARRAY['feed', 'small', 'dog']::text[]),
  ('SB088', 'hard', 'actions', 'Cậu ấy mang một chiếc hộp lớn.', 'He carries a big box.', '["He", "carries", "a", "big", "box."]'::jsonb, '["small", "ball"]'::jsonb, 'box', ARRAY['carry', 'big', 'box']::text[]),
  ('SB089', 'hard', 'food', 'Em bé uống sữa.', 'The baby drinks milk.', '["The", "baby", "drinks", "milk."]'::jsonb, '["water", "eat"]'::jsonb, 'milk', ARRAY['baby', 'drink', 'milk']::text[]),
  ('SB090', 'hard', 'food', 'Chúng tôi ăn trưa vào buổi trưa.', 'We eat lunch at noon.', '["We", "eat", "lunch", "at", "noon."]'::jsonb, '["dinner", "morning"]'::jsonb, 'lunch', ARRAY['eat', 'lunch', 'noon']::text[]),
  ('SB091', 'hard', 'time', 'Tôi đi ngủ lúc tám giờ.', 'I go to bed at eight.', '["I", "go", "to", "bed", "at", "eight."]'::jsonb, '["wake", "seven"]'::jsonb, 'bed', ARRAY['go', 'bed', 'eight']::text[]),
  ('SB092', 'hard', 'time', 'Cô ấy thức dậy sớm.', 'She wakes up early.', '["She", "wakes", "up", "early."]'::jsonb, '["sleep", "late"]'::jsonb, 'wake up', ARRAY['wake', 'up', 'early']::text[]),
  ('SB093', 'hard', 'time', 'Chúng tôi chơi sau giờ học.', 'We play after school.', '["We", "play", "after", "school."]'::jsonb, '["before", "home"]'::jsonb, 'school', ARRAY['play', 'after', 'school']::text[]),
  ('SB094', 'hard', 'actions', 'Làm ơn ngồi lên ghế.', 'Please sit on the chair.', '["Please", "sit", "on", "the", "chair."]'::jsonb, '["stand", "table"]'::jsonb, 'chair', ARRAY['please', 'sit', 'chair']::text[]),
  ('SB095', 'hard', 'actions', 'Đến chơi với tôi nhé.', 'Come and play with me.', '["Come", "and", "play", "with", "me."]'::jsonb, '["go", "alone"]'::jsonb, 'play', ARRAY['come', 'and', 'play', 'with', 'me']::text[]),
  ('SB096', 'hard', 'actions', 'Bạn có thể giúp tôi không?', 'Can you help me?', '["Can", "you", "help", "me?"]'::jsonb, '["sleep", "me"]'::jsonb, 'help', ARRAY['can', 'you', 'help']::text[]),
  ('SB097', 'hard', 'school', 'Bút chì màu đỏ của tôi đâu?', 'Where is my red pencil?', '["Where", "is", "my", "red", "pencil?"]'::jsonb, '["blue", "book"]'::jsonb, 'pencil', ARRAY['where', 'is', 'my', 'red', 'pencil']::text[]),
  ('SB098', 'hard', 'family', 'Tên bạn là gì?', 'What is your name?', '["What", "is", "your", "name?"]'::jsonb, '["where", "school"]'::jsonb, 'name', ARRAY['what', 'is', 'your', 'name']::text[]),
  ('SB099', 'hard', 'animals', 'Tôi thích chú cún nhỏ này.', 'I like this little puppy.', '["I", "like", "this", "little", "puppy."]'::jsonb, '["big", "kitten"]'::jsonb, 'puppy', ARRAY['like', 'this', 'little', 'puppy']::text[]),
  ('SB100', 'hard', 'home', 'Chúng ta hãy dọn phòng nhé.', 'Let us clean the room.', '["Let", "us", "clean", "the", "room."]'::jsonb, '["dirty", "garden"]'::jsonb, 'room', ARRAY['let', 'us', 'clean', 'the', 'room']::text[])
ON CONFLICT (question_id) DO NOTHING;

ALTER TABLE public.vocabulary_game_sessions DROP CONSTRAINT IF EXISTS vocabulary_game_sessions_game_type_check;
ALTER TABLE public.vocabulary_game_sessions ADD CONSTRAINT vocabulary_game_sessions_game_type_check CHECK (game_type IN ('word-match','word-scramble','word-maze','sentence-builder'));
DO $$ DECLARE has_legacy_12 boolean; BEGIN
  SELECT EXISTS (SELECT 1 FROM public.vocabulary_game_sessions WHERE game_type='word-match' AND round_size=12) INTO has_legacy_12;
  ALTER TABLE public.vocabulary_game_sessions DROP CONSTRAINT IF EXISTS vocabulary_game_sessions_round_size_score_check;
  IF has_legacy_12 THEN
    ALTER TABLE public.vocabulary_game_sessions ADD CONSTRAINT vocabulary_game_sessions_round_size_score_check CHECK (
      (game_type='word-match' AND round_size IN (6,8,10,12) AND score=correct_count*10) OR
      (game_type='word-scramble' AND round_size IN (5,10) AND score BETWEEN correct_count*10 AND correct_count*20) OR
      (game_type='word-maze' AND round_size=5 AND score=correct_count*10) OR
      (game_type='sentence-builder' AND round_size IN (5,10) AND correct_count <= round_size AND score=correct_count*10));
  ELSE
    ALTER TABLE public.vocabulary_game_sessions ADD CONSTRAINT vocabulary_game_sessions_round_size_score_check CHECK (
      (game_type='word-match' AND round_size IN (6,8,10) AND score=correct_count*10) OR
      (game_type='word-scramble' AND round_size IN (5,10) AND score BETWEEN correct_count*10 AND correct_count*20) OR
      (game_type='word-maze' AND round_size=5 AND score=correct_count*10) OR
      (game_type='sentence-builder' AND round_size IN (5,10) AND correct_count <= round_size AND score=correct_count*10));
  END IF;
END $$;
CREATE OR REPLACE FUNCTION public.save_vocabulary_game_session(
  p_game_type text,p_round_size integer,p_score integer,p_correct_count integer,p_moves integer,p_duration_seconds integer,p_started_at timestamptz,p_completed_at timestamptz
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user_id uuid := auth.uid(); v_session_id uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication is required to save game results.'; END IF;
  IF p_game_type IS NULL OR p_game_type NOT IN ('word-match','word-scramble','word-maze','sentence-builder') OR p_round_size IS NULL OR p_score IS NULL OR p_score < 0 OR p_correct_count IS NULL OR p_correct_count < 0 OR p_correct_count > p_round_size OR p_moves IS NULL OR p_moves < p_correct_count OR p_duration_seconds IS NULL OR p_duration_seconds < 0 OR p_started_at IS NULL OR p_completed_at IS NULL OR p_completed_at < p_started_at OR NOT (
    (p_game_type='word-match' AND p_round_size IN (6,8,10) AND p_correct_count=p_round_size AND p_score=p_correct_count*10) OR
    (p_game_type='word-scramble' AND p_round_size IN (5,10) AND p_correct_count=p_round_size AND p_score BETWEEN p_correct_count*10 AND p_correct_count*20) OR
    (p_game_type='word-maze' AND p_round_size=5 AND p_correct_count=p_round_size AND p_score=p_correct_count*10) OR
    (p_game_type='sentence-builder' AND p_round_size IN (5,10) AND p_score=p_correct_count*10)
  ) THEN RAISE EXCEPTION 'Invalid vocabulary game session data.'; END IF;
  INSERT INTO public.vocabulary_game_sessions(user_id,game_type,round_size,score,correct_count,moves,duration_seconds,started_at,completed_at)
  VALUES(v_user_id,p_game_type,p_round_size,p_score,p_correct_count,p_moves,p_duration_seconds,p_started_at,p_completed_at) RETURNING id INTO v_session_id;
  RETURN v_session_id;
END $$;
CREATE OR REPLACE FUNCTION public.get_vocabulary_game_leaderboard(p_game_type text,p_round_size integer,p_limit integer DEFAULT 50)
RETURNS TABLE(rank_position bigint,player_name text,avatar_path text,game_type text,round_size integer,score integer,correct_count integer,moves integer,duration_seconds integer,is_you boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user_id uuid := auth.uid();
BEGIN
 IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication is required to view game leaderboards.'; END IF;
 IF p_game_type IS NULL OR p_game_type NOT IN ('word-match','word-scramble','word-maze','sentence-builder') OR p_limit NOT BETWEEN 1 AND 100 OR NOT (
   (p_game_type='word-match' AND (p_round_size IS NULL OR p_round_size IN (6,8,10,12))) OR (p_game_type='word-scramble' AND (p_round_size IS NULL OR p_round_size IN (5,10))) OR (p_game_type='word-maze' AND (p_round_size IS NULL OR p_round_size=5)) OR (p_game_type='sentence-builder' AND (p_round_size IS NULL OR p_round_size IN (5,10)))
 ) THEN RAISE EXCEPTION 'Invalid vocabulary game leaderboard filters.'; END IF;
 RETURN QUERY WITH best AS (
   SELECT DISTINCT ON(s.user_id) s.user_id,s.game_type,s.round_size,s.score,s.correct_count,s.moves,s.duration_seconds,s.completed_at
   FROM public.vocabulary_game_sessions s WHERE s.game_type=p_game_type AND (p_round_size IS NULL OR s.round_size=p_round_size)
   ORDER BY s.user_id,s.score DESC,s.duration_seconds ASC,s.completed_at ASC
 ), ranked AS (
   SELECT b.*,COALESCE(profile.nickname,CASE WHEN b.user_id=v_user_id THEN 'You' ELSE 'Learner' END) AS player_name,profile.avatar_path,
    row_number() OVER(ORDER BY b.score DESC,b.duration_seconds ASC,b.completed_at ASC) AS rank_position
   FROM best b LEFT JOIN public.user_profiles profile ON profile.user_id=b.user_id
 ), visible AS (SELECT * FROM ranked ORDER BY ranked.rank_position LIMIT p_limit), own AS (SELECT * FROM ranked WHERE ranked.user_id=v_user_id AND ranked.rank_position>p_limit)
 SELECT v.rank_position,v.player_name,v.avatar_path,v.game_type,v.round_size,v.score,v.correct_count,v.moves,v.duration_seconds,(v.user_id=v_user_id) FROM visible v
 UNION ALL SELECT o.rank_position,o.player_name,o.avatar_path,o.game_type,o.round_size,o.score,o.correct_count,o.moves,o.duration_seconds,true FROM own o ORDER BY 1;
END $$;
REVOKE ALL ON FUNCTION public.save_vocabulary_game_session(text,integer,integer,integer,integer,integer,timestamptz,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_vocabulary_game_session(text,integer,integer,integer,integer,integer,timestamptz,timestamptz) TO authenticated;
REVOKE ALL ON FUNCTION public.get_vocabulary_game_leaderboard(text,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_vocabulary_game_leaderboard(text,integer,integer) TO authenticated;
