-- Add a complete phrase-first example that connects vocabulary, a useful phrase,
-- a sentence pattern, and a short restaurant booking dialogue.

WITH topic AS (
  SELECT id
  FROM public.communication_topics
  WHERE slug = 'food-restaurants'
), lesson AS (
  INSERT INTO public.communication_lessons
    (lesson_key, topic_id, title_en, title_vi, difficulty, sort_order, status)
  SELECT
    'restaurant-booking-easy', topic.id, 'Booking a table', 'Đặt bàn', 'easy', 1, 'published'
  FROM topic
  ON CONFLICT (lesson_key) DO UPDATE
    SET status = 'published', updated_at = now()
  RETURNING id
)
INSERT INTO public.communication_lesson_items
  (item_key, lesson_id, item_type, content_en, meaning_vi, example_en, example_vi, sort_order)
SELECT seed.item_key, lesson.id, seed.item_type, seed.content_en, seed.meaning_vi,
       seed.example_en, seed.example_vi, seed.sort_order
FROM lesson
CROSS JOIN (VALUES
  ('restaurant-reservation-word', 'word', 'reservation', 'việc đặt chỗ', 'Do you have a reservation?', 'Bạn đã đặt chỗ chưa?', 1),
  ('restaurant-make-reservation-phrase', 'phrase', 'make a reservation', 'đặt chỗ', 'I would like to make a reservation.', 'Tôi muốn đặt bàn.', 2),
  ('restaurant-book-table-pattern', 'sentence_pattern', 'I would like to book a table for ...', 'Tôi muốn đặt bàn cho ...', 'I would like to book a table for two at seven.', 'Tôi muốn đặt bàn cho hai người lúc bảy giờ.', 3),
  ('restaurant-window-seat-phrase', 'phrase', 'a table by the window', 'bàn cạnh cửa sổ', 'Could we have a table by the window?', 'Chúng tôi có thể ngồi bàn cạnh cửa sổ không?', 4),
  ('restaurant-menu-word', 'word', 'menu', 'thực đơn', 'Could I see the menu, please?', 'Cho tôi xem thực đơn được không?', 5),
  ('restaurant-host-word', 'word', 'host', 'nhân viên đón khách', 'The host showed us to our table.', 'Nhân viên đón khách dẫn chúng tôi đến bàn.', 6),
  ('restaurant-table-for-phrase', 'phrase', 'a table for two', 'bàn cho hai người', 'We need a table for two.', 'Chúng tôi cần một bàn cho hai người.', 7),
  ('restaurant-available-pattern', 'sentence_pattern', 'Do you have a table available at ...?', 'Nhà hàng còn bàn lúc ... không?', 'Do you have a table available at six thirty?', 'Nhà hàng còn bàn lúc sáu giờ rưỡi không?', 8),
  ('restaurant-party-size-pattern', 'sentence_pattern', 'There will be ... of us.', 'Chúng tôi có ... người.', 'There will be four of us.', 'Chúng tôi có bốn người.', 9),
  ('restaurant-booking-name-pattern', 'sentence_pattern', 'The reservation is under ...', 'Chỗ đặt bàn đứng tên ...', 'The reservation is under Nguyen.', 'Chỗ đặt bàn đứng tên Nguyen.', 10),
  ('restaurant-confirm-booking-phrase', 'phrase', 'confirm a reservation', 'xác nhận đặt chỗ', 'I am calling to confirm my reservation.', 'Tôi gọi để xác nhận chỗ đã đặt.', 11),
  ('restaurant-change-time-phrase', 'phrase', 'change the reservation', 'đổi thời gian đặt bàn', 'Could I change the reservation to eight?', 'Tôi có thể đổi giờ đặt bàn sang tám giờ không?', 12),
  ('restaurant-cancel-booking-phrase', 'phrase', 'cancel a reservation', 'hủy đặt chỗ', 'I need to cancel our reservation.', 'Tôi cần hủy chỗ đã đặt.', 13),
  ('restaurant-running-late-pattern', 'sentence_pattern', 'We are running ... minutes late.', 'Chúng tôi sẽ đến muộn ... phút.', 'We are running ten minutes late.', 'Chúng tôi sẽ đến muộn mười phút.', 14),
  ('restaurant-high-chair-word', 'word', 'high chair', 'ghế ăn cho trẻ nhỏ', 'Could we have a high chair for our child?', 'Cho chúng tôi xin một ghế ăn cho bé được không?', 15),
  ('restaurant-outdoor-seating-phrase', 'phrase', 'outdoor seating', 'chỗ ngồi ngoài trời', 'Do you have outdoor seating?', 'Nhà hàng có chỗ ngồi ngoài trời không?', 16),
  ('restaurant-window-seat-pattern', 'sentence_pattern', 'Could we sit ...?', 'Chúng tôi có thể ngồi ... không?', 'Could we sit near the window?', 'Chúng tôi có thể ngồi gần cửa sổ không?', 17),
  ('restaurant-special-occasion-phrase', 'phrase', 'a special occasion', 'dịp đặc biệt', 'We are celebrating a special occasion.', 'Chúng tôi đang mừng một dịp đặc biệt.', 18),
  ('restaurant-booking-spelling-pattern', 'sentence_pattern', 'How do you spell ...?', '... được đánh vần như thế nào?', 'How do you spell your last name?', 'Họ của bạn được đánh vần như thế nào?', 19),
  ('restaurant-booking-phone-pattern', 'sentence_pattern', 'My phone number is ...', 'Số điện thoại của tôi là ...', 'My phone number is 555-0184.', 'Số điện thoại của tôi là 555-0184.', 20),
  ('restaurant-booking-confirmation-phrase', 'phrase', 'a confirmation message', 'tin nhắn xác nhận', 'I received a confirmation message.', 'Tôi đã nhận được tin nhắn xác nhận.', 21),
  ('restaurant-booking-date-pattern', 'sentence_pattern', 'The reservation is for ...', 'Chỗ đặt bàn là cho ngày ...', 'The reservation is for Friday evening.', 'Chỗ đặt bàn là vào tối thứ Sáu.', 22),
  ('restaurant-booking-arrive-early-phrase', 'phrase', 'arrive a little early', 'đến sớm một chút', 'Please arrive a little early.', 'Vui lòng đến sớm một chút.', 23),
  ('restaurant-booking-keep-table-phrase', 'phrase', 'hold the table', 'giữ bàn', 'Could you hold the table for fifteen minutes?', 'Bạn có thể giữ bàn giúp tôi mười lăm phút không?', 24),
  ('restaurant-booking-look-forward-phrase', 'phrase', 'look forward to it', 'mong chờ điều đó', 'We look forward to our dinner.', 'Chúng tôi mong chờ bữa tối.', 25)
) AS seed(item_key, item_type, content_en, meaning_vi, example_en, example_vi, sort_order)
ON CONFLICT (item_key) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  item_type = EXCLUDED.item_type,
  content_en = EXCLUDED.content_en,
  meaning_vi = EXCLUDED.meaning_vi,
  example_en = EXCLUDED.example_en,
  example_vi = EXCLUDED.example_vi,
  sort_order = EXCLUDED.sort_order;

WITH lesson AS (
  SELECT id FROM public.communication_lessons WHERE lesson_key = 'restaurant-booking-easy'
), dialogue AS (
  INSERT INTO public.communication_dialogues
    (dialogue_key, lesson_id, title_en, title_vi, prompt_vi, sort_order)
  SELECT 'restaurant-booking-dialogue', lesson.id, 'Booking a table', 'Đặt bàn',
         'Nghe và chọn câu trả lời phù hợp khi đặt bàn tại nhà hàng.', 1
  FROM lesson
  ON CONFLICT (dialogue_key) DO UPDATE
    SET lesson_id = EXCLUDED.lesson_id, updated_at = now()
  RETURNING id
)
INSERT INTO public.communication_dialogue_turns
  (turn_key, dialogue_id, turn_order, speaker, text_en, meaning_vi,
   response_prompt_vi, expected_response, response_options)
SELECT seed.turn_key, dialogue.id, seed.turn_order, seed.speaker, seed.text_en,
       seed.meaning_vi, seed.response_prompt_vi, seed.expected_response,
       seed.response_options::jsonb
FROM dialogue
CROSS JOIN (VALUES
  ('restaurant-booking-turn-1', 1, 'Host', 'Good evening. Do you have a reservation?', 'Chào buổi tối. Quý khách đã đặt bàn chưa?', '', '', '[]'),
  ('restaurant-booking-turn-2', 2, 'Guest', 'I would like to make a reservation.', 'Tôi muốn đặt bàn.', '', 'I would like to make a reservation.', '["I would like to make a reservation.", "The weather is sunny.", "I need a phone charger."]'),
  ('restaurant-booking-turn-3', 3, 'Host', 'Certainly. Would you prefer a table by the window?', 'Dĩ nhiên. Quý khách có muốn ngồi bàn cạnh cửa sổ không?', '', '', '[]'),
  ('restaurant-booking-turn-4', 4, 'Guest', 'Yes, that would be lovely. Thank you.', 'Vâng, như vậy thì tốt quá. Cảm ơn.', '', 'Yes, that would be lovely. Thank you.', '["Yes, that would be lovely. Thank you.", "I would like the bill, please.", "I am looking for the station."]')
) AS seed(turn_key, turn_order, speaker, text_en, meaning_vi, response_prompt_vi,
          expected_response, response_options)
ON CONFLICT (turn_key) DO UPDATE SET
  dialogue_id = EXCLUDED.dialogue_id,
  turn_order = EXCLUDED.turn_order,
  speaker = EXCLUDED.speaker,
  text_en = EXCLUDED.text_en,
  meaning_vi = EXCLUDED.meaning_vi,
  response_prompt_vi = EXCLUDED.response_prompt_vi,
  expected_response = EXCLUDED.expected_response,
  response_options = EXCLUDED.response_options;
