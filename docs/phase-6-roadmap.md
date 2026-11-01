# Phase 6 — Situational English

## Goal

Help learners use vocabulary naturally in everyday conversations by connecting:

**word → useful phrase → sentence pattern → short dialogue**

Phase 6 is in progress. Completed items below have been implemented in the application; database migration and production data workflows still need the verification noted in the relevant sections.

## MVP backlog

### Phase 6 data model and CSV contract

- [x] Add tables for situations, level-based lessons, vocabulary/phrase/sentence items, dialogues and turns, learner progress, review scheduling, and daily goals.
- [x] Seed the 12 initial communication situations.
- [x] Restrict draft lesson content to admins; keep learner progress and review data private to its owner.
- [x] Build the admin editor and CSV import/export using the agreed row format below. Admin UI supports topic, lesson, and learning-item CRUD; dialogue turns are managed through CSV. The parser validates rows and repeated keys/metadata before it writes. Run a live import/export round trip before treating it as production-verified.

The CSV is long-form: one row represents either a lesson item or a dialogue turn. Repeat the topic and lesson fields on each row in that lesson. This keeps the sheet editable in standard spreadsheet tools while stable keys (`lesson_key`, `record_key`, and `dialogue_key`) make repeated imports update existing records.

| Column | Required | Meaning |
|---|---:|---|
| `record_type` | Yes | `item` or `dialogue_turn`. |
| `topic_slug`, `topic_title_en`, `topic_title_vi` | Yes | Stable topic key and bilingual topic names. |
| `topic_description_en`, `topic_description_vi`, `topic_order` | No | Topic description and display order. |
| `lesson_key`, `lesson_title_en`, `lesson_title_vi` | Yes | Stable lesson key and bilingual lesson names. |
| `difficulty`, `lesson_order`, `lesson_status` | Yes | `easy`/`medium`/`hard`, order, and `draft`/`published` state. |
| `record_key`, `record_order` | Yes | Stable item/turn key and order within its parent. |
| `item_type`, `content_en`, `meaning_vi` | For `item` | `word`, `phrase`, or `sentence_pattern`, English content, and Vietnamese meaning. |
| `example_en`, `example_vi`, `image_keyword`, `audio_url` | For `item` | Optional context and media fields. |
| `dialogue_key`, `dialogue_title_en` | For `dialogue_turn` | Stable dialogue key and title. |
| `dialogue_title_vi`, `dialogue_prompt_vi`, `speaker` | For `dialogue_turn` | Optional localized title/prompt and speaker label. |
| `turn_order`, `turn_text_en` | For `dialogue_turn` | Turn order and spoken English line. |
| `turn_meaning_vi`, `turn_audio_url` | No | Vietnamese turn meaning and audio URL. |
| `response_prompt_vi`, `expected_response`, `response_options_json` | No | Prompt and answer choices for interactive response practice; options are a JSON array. |

Example rows:

```csv
record_type,topic_slug,topic_title_en,topic_title_vi,lesson_key,lesson_title_en,lesson_title_vi,difficulty,lesson_order,lesson_status,record_key,record_order,item_type,content_en,meaning_vi,example_en,example_vi,dialogue_key,dialogue_title_en,speaker,turn_order,turn_text_en,turn_meaning_vi,expected_response,response_options_json
item,food-restaurants,Food and restaurants,Đồ ăn và nhà hàng,restaurant-booking-easy,Booking a table,Đặt bàn,easy,1,draft,reservation-phrase,1,phrase,make a reservation,đặt chỗ,I'd like to make a reservation.,Tôi muốn đặt bàn.,,,,,,,,
dialogue_turn,food-restaurants,Food and restaurants,Đồ ăn và nhà hàng,restaurant-booking-easy,Booking a table,Đặt bàn,easy,1,draft,booking-turn-1,1,,,,,booking-a-table,Booking a table,Host,1,Good evening. Do you have a reservation?,Chào buổi tối. Quý khách đã đặt bàn chưa?,,,[]
```

For a learner-facing dialogue exercise, a response turn should include `response_prompt_vi`, `expected_response`, and `response_options_json`; the expected response must be one of the listed options. CSV import must validate the complete file before writing any rows and report errors with row numbers.

### 1. Learning goal and learner path

- [x] Offer a learning goal: **Learn through games** or **Speak everyday English**.
- [x] Let learners change their goal from the communication learning page; the preference is saved privately to their account.
- [x] Organize lessons by practical situation and difficulty (Easy, Medium, Hard).
- [x] Show lesson progress and a clear suggested next lesson, adapting difficulty to reviewed accuracy when enough practice data exists.
- [x] Let learners set a daily practice goal and show today's progress in the situation catalog.

### 2. Situation-based lesson content

- [x] Support lessons containing vocabulary, useful phrases/collocations, sentence patterns, and short dialogues.
- [x] Show English content with Vietnamese meaning and examples in context.
- [ ] Target 25–30 learning items per situation, balancing single words with practical phrases.
- [x] Seed the initial situation catalog:
  1. Greetings and introductions
  2. Family and friends
  3. Daily routines
  4. Work and colleagues
  5. Food and restaurants
  6. Shopping and payments
  7. Transportation and directions
  8. Travel and hotels
  9. Health and feelings
  10. Hobbies and free time
  11. Time and appointments
  12. Phone and online communication
- [x] Extend the catalog with eight everyday topics and an Easy lesson with 10 practice items each:
  13. Education and classes
  14. Home and neighborhood
  15. Weather and seasons
  16. Money and banking
  17. Plans and invitations
  18. Customer service
  19. Emergencies and safety
  20. Technology and devices
- [ ] Include phrase-first examples, e.g. *reservation* → *I'd like to make a reservation* → a restaurant booking dialogue.

### 3. Practice and recall

- [x] Add a meaning-check quiz for words, phrases, and sentence patterns; store graded right/wrong attempts.
- [x] Add sentence completion and word-order drills using lesson example sentences, with results included in item review scheduling.
- [x] Add audio playback for lesson examples and dialogue turns (uploaded audio URL when supplied, browser speech playback as fallback).
- [x] Add listening comprehension that plays lesson example audio (or browser speech fallback), asks learners to choose its Vietnamese meaning, then reveals the transcript and schedules the result.
- [x] Add dialogue response practice with suggested choices and retry feedback. Speech recording/pronunciation feedback remains later work.
- [x] Schedule and show due Learning/Mastered reviews; selecting a due item opens its lesson at that item for active recall.
- [x] Track quiz accuracy automatically. Wrong answers return in 15 minutes; correct-answer intervals adapt to cumulative accuracy and lesson difficulty, with longer gaps for consistently accurate Easy lessons and shorter gaps for Hard or lower-accuracy items.
- [x] Adapt review intervals from longer-term accuracy and item difficulty. Manual Learning/Mastered ratings do not count as quiz answers.
- [x] Keep saved practice progress private to the signed-in learner through RLS.

### 4. Content administration

- [x] Provide admin-only create, edit, archive/remove, and browse tools for situations, lessons, and lesson items. Dialogue content is currently edited through CSV.
- [x] Support CSV import/export for bulk lesson content, with pre-write format/row validation and row-numbered errors. Live Supabase round-trip verification remains.
- [x] Validate situation/lesson/item relationships, difficulty, paired example translations, sentence-pattern examples, dialogue turn order/answer choices, and optional HTTP(S) audio links before CSV writes or manual saves. Live import/export round-trip verification remains.
- [x] Enforce administrator permissions on the admin page and database policies; learners can only read published lessons.

## Follow-up backlog

- [ ] Add optional speech recording and pronunciation feedback after evaluating browser/device support.
- [x] Recommend an easier lesson when recent accuracy is below 70%, or a harder lesson after accuracy reaches 90%; require at least three recorded answers before adjusting difficulty. Due reviews and in-progress lessons retain priority.
- [ ] Add more languages or age-specific learning paths if product scope requires them.

## Acceptance criteria

- A learner can choose or change a learning goal and see lessons suited to that goal.
- A situation lesson teaches connected vocabulary, phrases, sentence patterns, and a usable dialogue rather than isolated words alone. Meaning checks, sentence completion, and word-order drills track accuracy.
- Learners can practise listening and speaking with sentence/dialogue audio and receive clear retry guidance. Listening checks hide the transcript until the learner answers.
- Wrong practice answers return after 15 minutes; correct answers are spaced using cumulative accuracy and lesson difficulty. Self-marked Learning items are available immediately, and Mastered items are scheduled for a later review. Daily goal and lesson progress update after practice.
- Admin-only content tools reject learner access on both the UI and server/database layers.
- CSV import reports invalid rows without silently accepting incomplete or mismatched lesson data.
- Mobile, tablet, and desktop lesson and practice flows are usable without horizontal overflow.

## Suggested delivery order

1. [x] Finalize lesson data model and CSV format.
2. [x] Build the admin lesson editor/import/export and seed the first situations (build-checked; live CSV round trip remains).
3. [x] Build the situation catalog, lesson view, goal preferences, daily goal UI, due review queue, and basic progress tracking.
4. [x] Add meaning-check, sentence-completion, and word-order practice with basic right/wrong review scheduling.
5. [x] Add dialogue response practice, audio playback, and listening comprehension. Speech recording/pronunciation feedback remains future work.
6. Verify permissions, accessibility, responsive layouts, and end-to-end learner/admin flows.

