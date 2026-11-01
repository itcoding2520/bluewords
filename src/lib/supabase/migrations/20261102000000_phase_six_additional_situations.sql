INSERT INTO public.communication_topics
  (slug, title_en, title_vi, description_en, description_vi, sort_order, status)
VALUES
  ('education-classes', 'Education and classes', 'Học tập và lớp học', 'Ask questions, follow instructions, and talk about school.', 'Đặt câu hỏi, làm theo hướng dẫn và giao tiếp ở trường lớp.', 13, 'published'),
  ('home-neighborhood', 'Home and neighborhood', 'Nhà cửa và khu phố', 'Talk with neighbors and find everyday places nearby.', 'Trò chuyện với hàng xóm và tìm các địa điểm gần nhà.', 14, 'published'),
  ('weather-seasons', 'Weather and seasons', 'Thời tiết và các mùa', 'Describe the weather and make simple plans around it.', 'Miêu tả thời tiết và lên kế hoạch phù hợp.', 15, 'published'),
  ('money-banking', 'Money and banking', 'Tiền bạc và ngân hàng', 'Handle common payments and basic banking needs.', 'Giao tiếp khi thanh toán và dùng các dịch vụ ngân hàng cơ bản.', 16, 'published'),
  ('plans-invitations', 'Plans and invitations', 'Kế hoạch và lời mời', 'Invite people, make plans, and arrange a time to meet.', 'Mời mọi người, lên kế hoạch và hẹn giờ gặp nhau.', 17, 'published'),
  ('customer-service', 'Customer service', 'Dịch vụ khách hàng', 'Ask for help with an order, exchange, or refund.', 'Nhờ hỗ trợ về đơn hàng, đổi hàng hoặc hoàn tiền.', 18, 'published'),
  ('emergencies-safety', 'Emergencies and safety', 'Tình huống khẩn cấp và an toàn', 'Ask for urgent help and share essential information.', 'Yêu cầu trợ giúp khẩn cấp và cung cấp thông tin cần thiết.', 19, 'published'),
  ('technology-devices', 'Technology and devices', 'Công nghệ và thiết bị', 'Talk about phones, connections, and common device problems.', 'Giao tiếp về điện thoại, kết nối và sự cố thiết bị thường gặp.', 20, 'published')
ON CONFLICT (slug) DO NOTHING;

WITH lesson_seed (topic_slug, lesson_key, title_en, title_vi) AS (
  VALUES
    ('education-classes', 'education-classroom-easy', 'Everyday classroom English', 'Tiếng Anh giao tiếp trong lớp học'),
    ('home-neighborhood', 'home-neighborhood-easy', 'Around the neighborhood', 'Giao tiếp quanh khu phố'),
    ('weather-seasons', 'weather-seasons-easy', 'Talking about the weather', 'Nói về thời tiết'),
    ('money-banking', 'money-banking-easy', 'Everyday money and banking', 'Tiền bạc và ngân hàng hằng ngày'),
    ('plans-invitations', 'plans-invitations-easy', 'Making plans together', 'Cùng nhau lên kế hoạch'),
    ('customer-service', 'customer-service-easy', 'Getting help with a purchase', 'Nhờ hỗ trợ khi mua hàng'),
    ('emergencies-safety', 'emergencies-safety-easy', 'Asking for urgent help', 'Yêu cầu trợ giúp khẩn cấp'),
    ('technology-devices', 'technology-devices-easy', 'Everyday technology', 'Công nghệ trong đời sống')
)
INSERT INTO public.communication_lessons
  (lesson_key, topic_id, title_en, title_vi, difficulty, sort_order, status)
SELECT seed.lesson_key, topic.id, seed.title_en, seed.title_vi, 'easy', 1, 'published'
FROM lesson_seed seed
JOIN public.communication_topics topic ON topic.slug = seed.topic_slug
ON CONFLICT (lesson_key) DO NOTHING;

WITH item_seed (lesson_key, item_key, item_type, content_en, meaning_vi, example_en, example_vi, sort_order) AS (
  VALUES
    ('education-classroom-easy', 'classroom-class-word', 'word', 'class', 'lớp học', 'I have English class today.', 'Hôm nay tôi có tiết tiếng Anh.', 1),
    ('education-classroom-easy', 'classroom-subject-word', 'word', 'subject', 'môn học', 'Science is my favorite subject.', 'Khoa học là môn học yêu thích của tôi.', 2),
    ('education-classroom-easy', 'classroom-ask-question-phrase', 'phrase', 'ask a question', 'đặt câu hỏi', 'May I ask a question?', 'Em có thể đặt một câu hỏi không ạ?', 3),
    ('education-classroom-easy', 'classroom-hand-in-homework-phrase', 'phrase', 'hand in homework', 'nộp bài tập', 'Please hand in your homework tomorrow.', 'Ngày mai hãy nộp bài tập nhé.', 4),
    ('education-classroom-easy', 'classroom-work-in-pairs-phrase', 'phrase', 'work in pairs', 'làm việc theo cặp', 'Work in pairs to finish the activity.', 'Hãy làm việc theo cặp để hoàn thành hoạt động.', 5),
    ('education-classroom-easy', 'classroom-explain-pattern', 'sentence_pattern', 'Could you explain this to me?', 'Bạn có thể giải thích điều này cho tôi không?', 'Could you explain this question to me?', 'Bạn có thể giải thích câu hỏi này cho tôi không?', 6),
    ('education-classroom-easy', 'classroom-take-notes-phrase', 'phrase', 'take notes', 'ghi chép', 'I take notes during the lesson.', 'Tôi ghi chép trong giờ học.', 7),
    ('education-classroom-easy', 'classroom-break-word', 'word', 'break', 'giờ giải lao', 'We have a short break at ten.', 'Chúng tôi có giờ giải lao ngắn lúc mười giờ.', 8),
    ('education-classroom-easy', 'classroom-need-help-pattern', 'sentence_pattern', 'I need help with ...', 'Tôi cần giúp đỡ về ...', 'I need help with this exercise.', 'Tôi cần giúp đỡ với bài tập này.', 9),
    ('education-classroom-easy', 'classroom-read-aloud-phrase', 'phrase', 'read aloud', 'đọc thành tiếng', 'Please read the sentence aloud.', 'Vui lòng đọc câu đó thành tiếng.', 10),

    ('home-neighborhood-easy', 'neighborhood-neighbor-word', 'word', 'neighbor', 'hàng xóm', 'Our neighbor is very friendly.', 'Hàng xóm của chúng tôi rất thân thiện.', 1),
    ('home-neighborhood-easy', 'neighborhood-next-door-phrase', 'phrase', 'next door', 'nhà bên cạnh', 'The bakery is next door.', 'Tiệm bánh ở ngay bên cạnh.', 2),
    ('home-neighborhood-easy', 'neighborhood-grocery-store-phrase', 'phrase', 'grocery store', 'cửa hàng tạp hóa', 'There is a grocery store near my home.', 'Có một cửa hàng tạp hóa gần nhà tôi.', 3),
    ('home-neighborhood-easy', 'neighborhood-live-nearby-phrase', 'phrase', 'live nearby', 'sống gần đây', 'Do you live nearby?', 'Bạn có sống gần đây không?', 4),
    ('home-neighborhood-easy', 'neighborhood-just-moved-pattern', 'sentence_pattern', 'I just moved to ...', 'Tôi vừa chuyển đến ...', 'I just moved to this neighborhood.', 'Tôi vừa chuyển đến khu phố này.', 5),
    ('home-neighborhood-easy', 'neighborhood-borrow-pattern', 'sentence_pattern', 'Could I borrow ...?', 'Tôi có thể mượn ... không?', 'Could I borrow a phone charger?', 'Tôi có thể mượn bộ sạc điện thoại không?', 6),
    ('home-neighborhood-easy', 'neighborhood-pick-up-package-phrase', 'phrase', 'pick up a package', 'nhận một bưu kiện', 'I need to pick up a package.', 'Tôi cần nhận một bưu kiện.', 7),
    ('home-neighborhood-easy', 'neighborhood-quiet-area-phrase', 'phrase', 'quiet area', 'khu vực yên tĩnh', 'This is a quiet area.', 'Đây là một khu vực yên tĩnh.', 8),
    ('home-neighborhood-easy', 'neighborhood-find-pattern', 'sentence_pattern', 'Where can I find ...?', 'Tôi có thể tìm ... ở đâu?', 'Where can I find the nearest bus stop?', 'Tôi có thể tìm trạm xe buýt gần nhất ở đâu?', 9),
    ('home-neighborhood-easy', 'neighborhood-show-way-pattern', 'sentence_pattern', 'Could you show me the way to ...?', 'Bạn có thể chỉ đường đến ... không?', 'Could you show me the way to the park?', 'Bạn có thể chỉ đường đến công viên không?', 10),

    ('weather-seasons-easy', 'weather-sunny-word', 'word', 'sunny', 'có nắng', 'It is sunny this afternoon.', 'Chiều nay trời có nắng.', 1),
    ('weather-seasons-easy', 'weather-cloudy-word', 'word', 'cloudy', 'nhiều mây', 'It will be cloudy tomorrow.', 'Ngày mai trời sẽ nhiều mây.', 2),
    ('weather-seasons-easy', 'weather-windy-word', 'word', 'windy', 'có gió', 'It is too windy for a picnic.', 'Trời quá nhiều gió để đi dã ngoại.', 3),
    ('weather-seasons-easy', 'weather-forecast-word', 'word', 'forecast', 'dự báo thời tiết', 'The forecast says it may rain.', 'Dự báo thời tiết nói rằng trời có thể mưa.', 4),
    ('weather-seasons-easy', 'weather-how-pattern', 'sentence_pattern', 'What is the weather like?', 'Thời tiết thế nào?', 'What is the weather like today?', 'Hôm nay thời tiết thế nào?', 5),
    ('weather-seasons-easy', 'weather-umbrella-phrase', 'phrase', 'bring an umbrella', 'mang theo ô', 'Bring an umbrella just in case.', 'Hãy mang theo ô để đề phòng.', 6),
    ('weather-seasons-easy', 'weather-temperature-word', 'word', 'temperature', 'nhiệt độ', 'The temperature is quite low today.', 'Hôm nay nhiệt độ khá thấp.', 7),
    ('weather-seasons-easy', 'weather-might-rain-pattern', 'sentence_pattern', 'It might rain later.', 'Lát nữa trời có thể mưa.', 'Take a jacket; it might rain later.', 'Hãy mang áo khoác; lát nữa trời có thể mưa.', 8),
    ('weather-seasons-easy', 'weather-warmer-pattern', 'sentence_pattern', 'It is warmer than ...', 'Trời ấm hơn ...', 'It is warmer than yesterday.', 'Trời ấm hơn hôm qua.', 9),
    ('weather-seasons-easy', 'weather-season-word', 'word', 'season', 'mùa', 'Spring is my favorite season.', 'Mùa xuân là mùa tôi yêu thích nhất.', 10),

    ('money-banking-easy', 'banking-cash-word', 'word', 'cash', 'tiền mặt', 'Do you want to pay in cash?', 'Bạn muốn thanh toán bằng tiền mặt không?', 1),
    ('money-banking-easy', 'banking-account-word', 'word', 'bank account', 'tài khoản ngân hàng', 'I opened a bank account last month.', 'Tôi đã mở tài khoản ngân hàng tháng trước.', 2),
    ('money-banking-easy', 'banking-atm-word', 'word', 'ATM', 'máy rút tiền', 'There is an ATM across the street.', 'Có một máy rút tiền ở bên kia đường.', 3),
    ('money-banking-easy', 'banking-withdraw-phrase', 'phrase', 'withdraw cash', 'rút tiền mặt', 'I need to withdraw some cash.', 'Tôi cần rút một ít tiền mặt.', 4),
    ('money-banking-easy', 'banking-deposit-phrase', 'phrase', 'deposit money', 'gửi tiền', 'Can I deposit money at this machine?', 'Tôi có thể gửi tiền ở máy này không?', 5),
    ('money-banking-easy', 'banking-balance-word', 'word', 'balance', 'số dư', 'You can check your balance online.', 'Bạn có thể kiểm tra số dư trực tuyến.', 6),
    ('money-banking-easy', 'banking-open-account-pattern', 'sentence_pattern', 'I would like to open an account.', 'Tôi muốn mở một tài khoản.', 'I would like to open a savings account.', 'Tôi muốn mở một tài khoản tiết kiệm.', 7),
    ('money-banking-easy', 'banking-debit-card-phrase', 'phrase', 'debit card', 'thẻ ghi nợ', 'Can I pay with a debit card?', 'Tôi có thể thanh toán bằng thẻ ghi nợ không?', 8),
    ('money-banking-easy', 'banking-exchange-rate-phrase', 'phrase', 'exchange rate', 'tỷ giá', 'What is the exchange rate today?', 'Tỷ giá hôm nay là bao nhiêu?', 9),
    ('money-banking-easy', 'banking-transfer-money-phrase', 'phrase', 'transfer money', 'chuyển tiền', 'I need to transfer money to my family.', 'Tôi cần chuyển tiền cho gia đình.', 10),

    ('plans-invitations-easy', 'plans-free-tonight-pattern', 'sentence_pattern', 'Are you free tonight?', 'Tối nay bạn có rảnh không?', 'Are you free tonight? Let us have dinner.', 'Tối nay bạn có rảnh không? Chúng ta đi ăn tối nhé.', 1),
    ('plans-invitations-easy', 'plans-join-us-phrase', 'phrase', 'join us', 'tham gia cùng chúng tôi', 'Would you like to join us?', 'Bạn có muốn tham gia cùng chúng tôi không?', 2),
    ('plans-invitations-easy', 'plans-invite-word', 'word', 'invite', 'mời', 'I want to invite my friends.', 'Tôi muốn mời bạn bè của mình.', 3),
    ('plans-invitations-easy', 'plans-make-plans-phrase', 'phrase', 'make plans', 'lên kế hoạch', 'Let us make plans for the weekend.', 'Chúng ta hãy lên kế hoạch cho cuối tuần.', 4),
    ('plans-invitations-easy', 'plans-change-plans-phrase', 'phrase', 'change our plans', 'thay đổi kế hoạch', 'We may need to change our plans.', 'Có thể chúng ta cần thay đổi kế hoạch.', 5),
    ('plans-invitations-easy', 'plans-would-you-pattern', 'sentence_pattern', 'Would you like to ...?', 'Bạn có muốn ... không?', 'Would you like to see a movie?', 'Bạn có muốn đi xem phim không?', 6),
    ('plans-invitations-easy', 'plans-sounds-good-phrase', 'phrase', 'That sounds good.', 'Nghe hay đấy.', 'Saturday works for me. That sounds good.', 'Thứ Bảy phù hợp với tôi. Nghe hay đấy.', 7),
    ('plans-invitations-easy', 'plans-what-time-pattern', 'sentence_pattern', 'What time should we meet?', 'Chúng ta nên gặp nhau lúc mấy giờ?', 'What time should we meet at the station?', 'Chúng ta nên gặp nhau ở nhà ga lúc mấy giờ?', 8),
    ('plans-invitations-easy', 'plans-reschedule-phrase', 'phrase', 'reschedule the meeting', 'dời lịch cuộc hẹn', 'Can we reschedule the meeting?', 'Chúng ta có thể dời lịch cuộc hẹn không?', 9),
    ('plans-invitations-easy', 'plans-see-you-phrase', 'phrase', 'See you there.', 'Gặp bạn ở đó nhé.', 'I will arrive at six. See you there.', 'Tôi sẽ đến lúc sáu giờ. Gặp bạn ở đó nhé.', 10),

    ('customer-service-easy', 'service-receipt-word', 'word', 'receipt', 'hóa đơn', 'Do you still have the receipt?', 'Bạn vẫn còn hóa đơn chứ?', 1),
    ('customer-service-easy', 'service-refund-word', 'word', 'refund', 'hoàn tiền', 'Can I get a refund?', 'Tôi có thể được hoàn tiền không?', 2),
    ('customer-service-easy', 'service-exchange-word', 'word', 'exchange', 'đổi hàng', 'I would like to exchange this shirt.', 'Tôi muốn đổi chiếc áo này.', 3),
    ('customer-service-easy', 'service-damaged-word', 'word', 'damaged', 'bị hỏng', 'The package arrived damaged.', 'Gói hàng được giao đến trong tình trạng bị hỏng.', 4),
    ('customer-service-easy', 'service-return-pattern', 'sentence_pattern', 'I would like to return ...', 'Tôi muốn trả lại ...', 'I would like to return these shoes.', 'Tôi muốn trả lại đôi giày này.', 5),
    ('customer-service-easy', 'service-size-pattern', 'sentence_pattern', 'Do you have this in ...?', 'Bạn có sản phẩm này cỡ ... không?', 'Do you have this in a larger size?', 'Bạn có sản phẩm này cỡ lớn hơn không?', 6),
    ('customer-service-easy', 'service-speak-manager-pattern', 'sentence_pattern', 'Could I speak to a manager?', 'Tôi có thể nói chuyện với quản lý không?', 'Could I speak to a manager about my order?', 'Tôi có thể nói chuyện với quản lý về đơn hàng của mình không?', 7),
    ('customer-service-easy', 'service-order-number-phrase', 'phrase', 'order number', 'mã đơn hàng', 'My order number is 2486.', 'Mã đơn hàng của tôi là 2486.', 8),
    ('customer-service-easy', 'service-delivery-word', 'word', 'delivery', 'việc giao hàng', 'When will the delivery arrive?', 'Khi nào hàng sẽ được giao đến?', 9),
    ('customer-service-easy', 'service-check-order-pattern', 'sentence_pattern', 'Could you check my order?', 'Bạn có thể kiểm tra đơn hàng giúp tôi không?', 'Could you check my order status, please?', 'Bạn có thể vui lòng kiểm tra tình trạng đơn hàng giúp tôi không?', 10),

    ('emergencies-safety-easy', 'safety-emergency-word', 'word', 'emergency', 'tình huống khẩn cấp', 'Call this number in an emergency.', 'Hãy gọi số này trong trường hợp khẩn cấp.', 1),
    ('emergencies-safety-easy', 'safety-ambulance-word', 'word', 'ambulance', 'xe cứu thương', 'Please call an ambulance.', 'Làm ơn gọi xe cứu thương.', 2),
    ('emergencies-safety-easy', 'safety-first-aid-phrase', 'phrase', 'first aid', 'sơ cứu', 'He needs first aid.', 'Anh ấy cần được sơ cứu.', 3),
    ('emergencies-safety-easy', 'safety-call-help-phrase', 'phrase', 'call for help', 'gọi trợ giúp', 'I need to call for help.', 'Tôi cần gọi trợ giúp.', 4),
    ('emergencies-safety-easy', 'safety-doctor-pattern', 'sentence_pattern', 'I need a doctor.', 'Tôi cần gặp bác sĩ.', 'I feel very sick. I need a doctor.', 'Tôi cảm thấy rất mệt. Tôi cần gặp bác sĩ.', 5),
    ('emergencies-safety-easy', 'safety-lost-word', 'word', 'lost', 'bị lạc', 'I am lost. Can you help me?', 'Tôi bị lạc. Bạn có thể giúp tôi không?', 6),
    ('emergencies-safety-easy', 'safety-be-careful-phrase', 'phrase', 'be careful', 'hãy cẩn thận', 'Be careful when you cross the road.', 'Hãy cẩn thận khi băng qua đường.', 7),
    ('emergencies-safety-easy', 'safety-hospital-pattern', 'sentence_pattern', 'Where is the nearest hospital?', 'Bệnh viện gần nhất ở đâu?', 'Where is the nearest hospital?', 'Bệnh viện gần nhất ở đâu?', 8),
    ('emergencies-safety-easy', 'safety-accident-word', 'word', 'accident', 'tai nạn', 'There has been an accident.', 'Đã xảy ra một vụ tai nạn.', 9),
    ('emergencies-safety-easy', 'safety-address-pattern', 'sentence_pattern', 'My address is ...', 'Địa chỉ của tôi là ...', 'My address is 24 Green Street.', 'Địa chỉ của tôi là số 24 đường Green.', 10),

    ('technology-devices-easy', 'technology-password-word', 'word', 'password', 'mật khẩu', 'I forgot my password.', 'Tôi quên mật khẩu rồi.', 1),
    ('technology-devices-easy', 'technology-screen-word', 'word', 'screen', 'màn hình', 'The screen is too bright.', 'Màn hình quá sáng.', 2),
    ('technology-devices-easy', 'technology-charger-word', 'word', 'charger', 'bộ sạc', 'Do you have a phone charger?', 'Bạn có bộ sạc điện thoại không?', 3),
    ('technology-devices-easy', 'technology-battery-word', 'word', 'battery', 'pin', 'My battery is almost empty.', 'Pin của tôi sắp hết rồi.', 4),
    ('technology-devices-easy', 'technology-wifi-word', 'word', 'Wi-Fi', 'mạng Wi-Fi', 'The Wi-Fi is not working.', 'Mạng Wi-Fi không hoạt động.', 5),
    ('technology-devices-easy', 'technology-connect-wifi-phrase', 'phrase', 'connect to Wi-Fi', 'kết nối Wi-Fi', 'How do I connect to Wi-Fi?', 'Tôi kết nối Wi-Fi bằng cách nào?', 6),
    ('technology-devices-easy', 'technology-phone-pattern', 'sentence_pattern', 'My phone is not working.', 'Điện thoại của tôi không hoạt động.', 'My phone is not working. Could you help me?', 'Điện thoại của tôi không hoạt động. Bạn có thể giúp tôi không?', 7),
    ('technology-devices-easy', 'technology-turn-on-phrase', 'phrase', 'turn on the device', 'bật thiết bị', 'Press here to turn on the device.', 'Nhấn vào đây để bật thiết bị.', 8),
    ('technology-devices-easy', 'technology-download-app-phrase', 'phrase', 'download an app', 'tải ứng dụng', 'You can download the app for free.', 'Bạn có thể tải ứng dụng miễn phí.', 9),
    ('technology-devices-easy', 'technology-send-message-phrase', 'phrase', 'send a message', 'gửi tin nhắn', 'I will send you a message later.', 'Tôi sẽ gửi tin nhắn cho bạn sau.', 10)
)
INSERT INTO public.communication_lesson_items
  (item_key, lesson_id, item_type, content_en, meaning_vi, example_en, example_vi, sort_order)
SELECT seed.item_key, lesson.id, seed.item_type, seed.content_en, seed.meaning_vi, seed.example_en, seed.example_vi, seed.sort_order
FROM item_seed seed
JOIN public.communication_lessons lesson ON lesson.lesson_key = seed.lesson_key
ON CONFLICT (item_key) DO NOTHING;
