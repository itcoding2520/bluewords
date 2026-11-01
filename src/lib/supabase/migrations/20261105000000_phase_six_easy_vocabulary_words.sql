-- Add foundational single-word vocabulary to Easy lessons. These entries
-- complement the existing phrase and sentence-pattern practice.
WITH word_seed (lesson_key, item_key, content_en, meaning_vi, example_en, example_vi, sort_order) AS (
  VALUES
    ('greetings-introductions-easy', 'greetings-easy-welcome-word', 'welcome', 'chào mừng', 'Welcome to our English class.', 'Chào mừng bạn đến với lớp tiếng Anh của chúng tôi.', 11),
    ('greetings-introductions-easy', 'greetings-easy-name-word', 'name', 'tên', 'My name is Alex.', 'Tên tôi là Alex.', 12),
    ('family-friends-easy', 'family-easy-sibling-word', 'sibling', 'anh chị em ruột', 'I have one sibling.', 'Tôi có một anh chị em ruột.', 11),
    ('family-friends-easy', 'family-easy-cousin-word', 'cousin', 'anh chị em họ', 'My cousin lives nearby.', 'Anh chị em họ của tôi sống gần đây.', 12),
    ('daily-routines-easy', 'routines-easy-breakfast-word', 'breakfast', 'bữa sáng', 'I eat breakfast at seven.', 'Tôi ăn sáng lúc bảy giờ.', 11),
    ('daily-routines-easy', 'routines-easy-commute-word', 'commute', 'việc đi làm hằng ngày', 'My commute takes twenty minutes.', 'Tôi mất hai mươi phút để đi làm.', 12),
    ('work-colleagues-easy', 'work-easy-colleague-word', 'colleague', 'đồng nghiệp', 'My colleague sits next to me.', 'Đồng nghiệp của tôi ngồi cạnh tôi.', 11),
    ('work-colleagues-easy', 'work-easy-deadline-word', 'deadline', 'hạn chót', 'The deadline is Friday.', 'Hạn chót là thứ Sáu.', 12),
    ('shopping-payments-easy', 'shopping-easy-price-word', 'price', 'giá', 'What is the price of this bag?', 'Chiếc túi này giá bao nhiêu?', 11),
    ('shopping-payments-easy', 'shopping-easy-receipt-word', 'receipt', 'hóa đơn', 'Can I have a receipt, please?', 'Cho tôi xin hóa đơn được không?', 12),
    ('transport-directions-easy', 'transport-easy-platform-word', 'platform', 'sân ga', 'The train leaves from platform three.', 'Tàu khởi hành từ sân ga số ba.', 11),
    ('transport-directions-easy', 'transport-easy-fare-word', 'fare', 'giá vé', 'How much is the bus fare?', 'Vé xe buýt giá bao nhiêu?', 12),
    ('travel-hotels-easy', 'travel-easy-passport-word', 'passport', 'hộ chiếu', 'Please show your passport at check-in.', 'Vui lòng xuất trình hộ chiếu khi làm thủ tục.', 11),
    ('travel-hotels-easy', 'travel-easy-luggage-word', 'luggage', 'hành lý', 'My luggage is in the car.', 'Hành lý của tôi ở trong xe.', 12),
    ('health-feelings-easy', 'health-easy-symptom-word', 'symptom', 'triệu chứng', 'A cough is a common symptom.', 'Ho là một triệu chứng thường gặp.', 11),
    ('health-feelings-easy', 'health-easy-pharmacy-word', 'pharmacy', 'hiệu thuốc', 'Is there a pharmacy near here?', 'Gần đây có hiệu thuốc nào không?', 12),
    ('hobbies-free-time-easy', 'hobbies-easy-hobby-word', 'hobby', 'sở thích', 'Reading is my favorite hobby.', 'Đọc sách là sở thích yêu thích của tôi.', 11),
    ('hobbies-free-time-easy', 'hobbies-easy-practice-word', 'practice', 'việc luyện tập', 'We have football practice today.', 'Hôm nay chúng tôi có buổi tập bóng đá.', 12),
    ('time-appointments-easy', 'time-easy-schedule-word', 'schedule', 'lịch trình', 'My schedule is busy this week.', 'Lịch trình của tôi tuần này khá bận.', 11),
    ('time-appointments-easy', 'time-easy-calendar-word', 'calendar', 'lịch', 'I wrote the appointment on my calendar.', 'Tôi đã ghi cuộc hẹn vào lịch.', 12),
    ('phone-online-easy', 'phone-easy-voicemail-word', 'voicemail', 'thư thoại', 'I left you a voicemail.', 'Tôi đã để lại cho bạn một tin nhắn thoại.', 11),
    ('phone-online-easy', 'phone-easy-attachment-word', 'attachment', 'tệp đính kèm', 'The photo is in the email attachment.', 'Bức ảnh nằm trong tệp đính kèm của email.', 12),
    ('education-and-classes-easy', 'education-easy-classroom-word', 'classroom', 'phòng học', 'The students are in the classroom.', 'Học sinh đang ở trong phòng học.', 11),
    ('education-and-classes-easy', 'education-easy-assignment-word', 'assignment', 'bài tập được giao', 'Our assignment is due tomorrow.', 'Bài tập của chúng tôi phải nộp vào ngày mai.', 12),
    ('home-and-neighborhood-easy', 'home-easy-balcony-word', 'balcony', 'ban công', 'There are flowers on the balcony.', 'Có hoa ở trên ban công.', 11),
    ('home-and-neighborhood-easy', 'home-easy-laundry-word', 'laundry', 'đồ giặt', 'I do the laundry on Sundays.', 'Tôi giặt quần áo vào Chủ nhật.', 12),
    ('weather-and-seasons-easy', 'weather-easy-forecast-word', 'forecast', 'dự báo thời tiết', 'The forecast says it will rain.', 'Dự báo thời tiết nói trời sẽ mưa.', 11),
    ('weather-and-seasons-easy', 'weather-easy-breeze-word', 'breeze', 'làn gió nhẹ', 'A cool breeze is coming from the sea.', 'Một làn gió mát đang thổi từ biển vào.', 12),
    ('money-and-banking-easy', 'money-easy-deposit-word', 'deposit', 'khoản tiền gửi', 'I made a deposit this morning.', 'Sáng nay tôi đã gửi một khoản tiền.', 11),
    ('money-and-banking-easy', 'money-easy-withdrawal-word', 'withdrawal', 'việc rút tiền', 'There is a fee for each withdrawal.', 'Mỗi lần rút tiền đều có phí.', 12),
    ('plans-and-invitations-easy', 'plans-easy-invitation-word', 'invitation', 'lời mời', 'Thank you for the invitation.', 'Cảm ơn lời mời của bạn.', 11),
    ('plans-and-invitations-easy', 'plans-easy-weekend-word', 'weekend', 'cuối tuần', 'Are you free this weekend?', 'Cuối tuần này bạn có rảnh không?', 12),
    ('customer-service-easy', 'service-easy-exchange-word', 'exchange', 'việc đổi hàng', 'The store offers free exchange.', 'Cửa hàng hỗ trợ đổi hàng miễn phí.', 11),
    ('customer-service-easy', 'service-easy-refund-word', 'refund', 'khoản hoàn tiền', 'When will I get my refund?', 'Khi nào tôi sẽ nhận được tiền hoàn lại?', 12),
    ('emergencies-and-safety-easy', 'safety-easy-emergency-word', 'emergency', 'tình huống khẩn cấp', 'Call this number in an emergency.', 'Hãy gọi số này trong trường hợp khẩn cấp.', 11),
    ('emergencies-and-safety-easy', 'safety-easy-ambulance-word', 'ambulance', 'xe cứu thương', 'An ambulance is on its way.', 'Xe cứu thương đang trên đường đến.', 12),
    ('technology-and-devices-easy', 'technology-easy-battery-word', 'battery', 'pin', 'My phone battery is low.', 'Pin điện thoại của tôi sắp hết.', 11),
    ('technology-and-devices-easy', 'technology-easy-update-word', 'update', 'bản cập nhật', 'The app needs an update.', 'Ứng dụng cần được cập nhật.', 12)
)
INSERT INTO public.communication_lesson_items
  (item_key, lesson_id, item_type, content_en, meaning_vi, example_en, example_vi, sort_order)
SELECT seed.item_key, lesson.id, 'word', seed.content_en, seed.meaning_vi,
       seed.example_en, seed.example_vi, seed.sort_order
FROM word_seed seed
JOIN public.communication_lessons lesson ON lesson.lesson_key = seed.lesson_key
ON CONFLICT (item_key) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  item_type = EXCLUDED.item_type,
  content_en = EXCLUDED.content_en,
  meaning_vi = EXCLUDED.meaning_vi,
  example_en = EXCLUDED.example_en,
  example_vi = EXCLUDED.example_vi,
  sort_order = EXCLUDED.sort_order;
