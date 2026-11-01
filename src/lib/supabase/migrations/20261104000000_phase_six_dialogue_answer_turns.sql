-- Keep the spoken prompt visible and attach each choice set to the learner's
-- response turn. The lesson UI hides that response until a correct choice.
UPDATE public.communication_dialogue_turns AS turn
SET response_prompt_vi = seed.response_prompt_vi,
    expected_response = seed.expected_response,
    response_options = seed.response_options::jsonb,
    text_en = seed.text_en,
    meaning_vi = seed.meaning_vi
FROM (VALUES
  ('restaurant-booking-turn-1', '', '', 'Good evening. Do you have a reservation?', 'Chào buổi tối. Quý khách đã đặt bàn chưa?', '[]'),
  ('restaurant-booking-turn-2', '', 'I would like to make a reservation.', 'I would like to make a reservation.', 'Tôi muốn đặt bàn.', '["I would like to make a reservation.", "The weather is sunny.", "I need a phone charger."]'),
  ('restaurant-booking-turn-3', '', '', 'Certainly. Would you prefer a table by the window?', 'Dĩ nhiên. Quý khách có muốn ngồi bàn cạnh cửa sổ không?', '[]'),
  ('restaurant-booking-turn-4', '', 'Yes, that would be lovely. Thank you.', 'Yes, that would be lovely. Thank you.', 'Vâng, như vậy thì tốt quá. Cảm ơn.', '["Yes, that would be lovely. Thank you.", "I would like the bill, please.", "I am looking for the station."]')
) AS seed(turn_key, response_prompt_vi, expected_response, text_en, meaning_vi, response_options)
WHERE turn.turn_key = seed.turn_key;
