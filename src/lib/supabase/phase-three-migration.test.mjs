import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(new URL("./migrations/20261025100000_phase_three_community_and_uniqueness.sql", import.meta.url), "utf8");
const defaultKeys = await readFile(new URL("./migrations/20261025110000_seed_default_vocabulary_keys.sql", import.meta.url), "utf8");
const publicShared = await readFile(new URL("./migrations/20261025140000_public_shared_vocabulary.sql", import.meta.url), "utf8");
const notificationDetails = await readFile(new URL("./migrations/20261025150000_publish_request_notification_details.sql", import.meta.url), "utf8");
const aggregatedNotifications = await readFile(new URL("./migrations/20261025160000_aggregate_publish_notifications.sql", import.meta.url), "utf8");
const categoryImages = await readFile(new URL("./migrations/20261025170000_category_images.sql", import.meta.url), "utf8");
const notificationsUi = await readFile(new URL("../../components/notifications/NotificationsContent.tsx", import.meta.url), "utf8");
const adminReviewUi = await readFile(new URL("../../components/admin/AdminReviewContent.tsx", import.meta.url), "utf8");
const defaultVocabulary = JSON.parse(await readFile(new URL("../../data/default-vocabulary.json", import.meta.url), "utf8"));

test("private vocabulary uniqueness uses owner, category, and English spelling only", () => {
  assert.match(migration, /UNIQUE INDEX IF NOT EXISTS vocabulary_words_user_category_word_key\s+ON public\.vocabulary_words \(user_id, category, lower\(regexp_replace\(btrim\(word\), '\[\[:space:\]\]\+', ' ', 'g'\) COLLATE "C"\)\)/);
  assert.match(migration, /Cannot apply Phase 3 uniqueness:[\s\S]*duplicate user\/category\/word groups need review first/);
  assert.doesNotMatch(migration, /UNIQUE INDEX IF NOT EXISTS vocabulary_words_user_category_word_key[^;]*meaning/i);
});

test("published community categories and words have global category-scoped uniqueness", () => {
  assert.match(migration, /community_categories_active_name_key[\s\S]*ON public\.community_categories \(normalized_name\) WHERE status IN \('pending', 'published'\)/);
  assert.match(migration, /community_words_active_category_word_key[\s\S]*ON public\.community_words \(category_id, normalized_word\) WHERE status IN \('pending', 'published'\)/);
});

test("publishing cannot duplicate starter words or precede category approval", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.default_vocabulary_keys/);
  assert.match(defaultKeys, /\('animals', 'cat'\)/);
  assert.match(migration, /A community word can only be published after its category is approved/);
  assert.match(migration, /This word already exists in the default vocabulary category/);
});

test("the default library itself is unique by normalized English word and category", () => {
  const normalize = (value) => value.trim().replace(/\s+/g, " ").toLowerCase();
  const keys = defaultVocabulary.map((entry) => `${normalize(entry.category)}\u0000${normalize(entry.word)}`);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(keys.length, 450);
});

test("guests receive no community table access and can only read starter images", () => {
  assert.match(migration, /REVOKE ALL ON public\.community_categories FROM PUBLIC, anon, authenticated/);
  assert.match(migration, /REVOKE ALL ON public\.community_words FROM PUBLIC, anon, authenticated/);
  assert.match(migration, /CREATE POLICY "Guests can view starter vocabulary images"[\s\S]*FOR SELECT TO anon[\s\S]*bucket_id = 'vocabulary-images'[\s\S]*'default-vocabulary'/);
});

test("moderation transitions create request and decision notifications", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.notifications/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.notify_vocabulary_moderation/);
  assert.match(migration, /'publish_request'/);
  assert.match(migration, /'publish_approved'/);
  assert.match(migration, /'publish_rejected'/);
});

test("starter categories have shared records for approved guest-visible word contributions", () => {
  assert.match(publicShared, /INSERT INTO public\.community_categories \(owner_id, name, color, status\)/);
  assert.match(publicShared, /'Actions'[\s\S]*'Animals'[\s\S]*'Weather'/);
  assert.match(publicShared, /WHERE existing\.normalized_name = lower\(defaults\.name\)[\s\S]*existing\.status IN \('pending', 'published'\)/);
  assert.match(publicShared, /GRANT SELECT ON public\.community_categories, public\.community_words TO service_role/);
});

test("category avatars use a separate public bucket and category image fields", () => {
  assert.match(categoryImages, /ALTER TABLE public\.vocabulary_categories\s+ADD COLUMN IF NOT EXISTS image_path text/);
  assert.match(categoryImages, /ALTER TABLE public\.community_categories\s+ADD COLUMN IF NOT EXISTS image_path text/);
  assert.match(categoryImages, /VALUES \('category-images', 'category-images', true/);
  assert.match(categoryImages, /Anyone can view category images[\s\S]*bucket_id = 'category-images'/);
  assert.match(categoryImages, /Users can upload own category images[\s\S]*storage\.foldername\(name\)\)\[1\] = \(SELECT auth\.uid\(\)\)::text/);
  assert.doesNotMatch(categoryImages, /UPDATE storage\.buckets[\s\S]*vocabulary-images[\s\S]*public = true/);
});

test("admin publish notifications identify the requester and link to review", () => {
  assert.match(notificationDetails, /SELECT COALESCE\(email, 'A user'\) INTO v_actor_email[\s\S]*FROM auth\.users/);
  assert.match(notificationDetails, /requested to publish word/);
  assert.match(notificationDetails, /requested to publish category/);
  assert.match(notificationDetails, /UPDATE public\.notifications AS notification[\s\S]*WHERE notification\.kind = 'publish_request'/);
  assert.match(notificationsUi, /item\.kind === "publish_request"[\s\S]*href="\/admin"[\s\S]*Review/);
});

test("publish notification batches coalesce per sender and request type", () => {
  assert.match(aggregatedNotifications, /PARTITION BY recipient_id, actor_id, entity_type/);
  assert.match(aggregatedNotifications, /notifications_unread_publish_request_batch_key[\s\S]*WHERE kind = 'publish_request' AND read_at IS NULL/);
  assert.match(aggregatedNotifications, /ON CONFLICT \(recipient_id, actor_id, entity_type\)[\s\S]*DO UPDATE SET[\s\S]*created_at = now\(\)/);
  assert.match(aggregatedNotifications, /submitted category requests for review/);
  assert.match(aggregatedNotifications, /submitted word requests for review/);
  assert.match(aggregatedNotifications, /COALESCE\(v_actor_email, 'A user'\)/);
});

test("admin is warned before approving a word with an unapproved category", () => {
  assert.match(adminReviewUi, /community_categories!inner\(name, status, image_path, color\)/);
  assert.match(adminReviewUi, /table === "community_words" && status === "published"[\s\S]*?word\.category_status !== "published"[\s\S]*?setBlockedWordId\(id\)[\s\S]*?return/);
  assert.match(adminReviewUi, /Approve category[\s\S]*before approving this word/);
});
