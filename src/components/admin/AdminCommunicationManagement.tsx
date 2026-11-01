"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Download, FileUp, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createInvalidatableAsyncCache } from "@/lib/supabase/invalidatable-async-cache.mjs";
import { fetchAllPages } from "@/lib/supabase/fetch-all-pages.mjs";
import { Select } from "@/components/ui/Select";
import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";
import { exportCommunicationCsv, parseCommunicationCsvDetailed, type CommunicationCsvRecord, type CommunicationDifficulty, type ContentStatus } from "@/lib/supabase/situational-english";

type Topic = { id: string; slug: string; title_en: string; title_vi: string; description_en: string; description_vi: string; sort_order: number; status: ContentStatus };
type Lesson = { id: string; topic_id: string; lesson_key: string; title_en: string; title_vi: string; difficulty: CommunicationDifficulty; sort_order: number; status: ContentStatus };
type Item = { id: string; lesson_id: string; item_key: string; item_type: "word" | "phrase" | "sentence_pattern"; content_en: string; meaning_vi: string; example_en: string; example_vi: string; image_keyword: string; audio_url: string; sort_order: number };
type ExportDialogue = { id: string; dialogue_key: string; lesson_id: string; title_en: string; title_vi: string; prompt_vi: string; sort_order: number };
type ExportTurn = { id: string; turn_key: string; dialogue_id: string; turn_order: number; speaker: string; text_en: string; meaning_vi: string; audio_url: string; response_prompt_vi: string; expected_response: string; response_options: string[] };
type LessonDraft = Omit<Lesson, "id">;
type ItemDraft = Omit<Item, "id">;
const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-sky-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
const initialLesson: LessonDraft = { topic_id: "", lesson_key: "", title_en: "", title_vi: "", difficulty: "easy", sort_order: 1, status: "draft" };
const initialItem: ItemDraft = { lesson_id: "", item_key: "", item_type: "word", content_en: "", meaning_vi: "", example_en: "", example_vi: "", image_keyword: "", audio_url: "", sort_order: 1 };
type CommunicationCollections = { topics: Topic[]; lessons: Lesson[]; items: Item[] };
type TopicWordCounts = { easy: number; medium: number; hard: number };
const COLLECTION_CACHE_TTL = 60_000;
const COLLECTION_CACHE_VERSION = "v2-paginated-items";
const collectionsCache = createInvalidatableAsyncCache();
const collectionsCacheExpiry = new Map<string, number>();

function isOptionalHttpUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch { return false; }
}

export function AdminCommunicationManagement() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [topicDraft, setTopicDraft] = useState({ slug: "", title_en: "", title_vi: "", description_en: "", description_vi: "", sort_order: 1, status: "draft" as ContentStatus });
  const [topicEditing, setTopicEditing] = useState<string | null>(null);
  const [lessonDraft, setLessonDraft] = useState<LessonDraft>(initialLesson);
  const [lessonEditing, setLessonEditing] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState<ItemDraft>(initialItem);
  const [itemEditing, setItemEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [topicSearch, setTopicSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirmDialog();
  const supabase = useMemo(() => createClient(), []);
  const currentTopic = topics.find((topic) => topic.id === selectedTopicId) ?? null;
  const currentLessons = lessons.filter((lesson) => lesson.topic_id === selectedTopicId);
  const currentItems = items.filter((item) => item.lesson_id === selectedLessonId);
  const filteredTopics = topics.filter((topic) => `${topic.title_en} ${topic.title_vi} ${topic.slug}`.toLowerCase().includes(topicSearch.toLowerCase()));
  const topicWordCounts = useMemo(() => {
    const wordsByLesson = new Map<string, Set<string>>();
    for (const item of items) {
      if (item.item_type !== "word") continue;
      const words = wordsByLesson.get(item.lesson_id) ?? new Set<string>();
      words.add(item.content_en.trim().toLocaleLowerCase());
      wordsByLesson.set(item.lesson_id, words);
    }
    const wordsByTopic = new Map<string, Record<CommunicationDifficulty, Set<string>>>();
    for (const lesson of lessons) {
      const levels = wordsByTopic.get(lesson.topic_id) ?? {
        easy: new Set<string>(), medium: new Set<string>(), hard: new Set<string>(),
      };
      for (const word of wordsByLesson.get(lesson.id) ?? []) levels[lesson.difficulty].add(word);
      wordsByTopic.set(lesson.topic_id, levels);
    }
    return new Map<string, TopicWordCounts>([...wordsByTopic].map(([topicId, levels]) => [topicId, {
      easy: levels.easy.size,
      medium: levels.medium.size,
      hard: levels.hard.size,
    }]));
  }, [items, lessons]);

  async function loadCollections(force = false): Promise<CommunicationCollections> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const userId = session?.user.id;
    if (!userId) throw new Error("Your session has expired. Sign in again to manage communication content.");

    if (force || (collectionsCacheExpiry.get(userId) ?? 0) <= Date.now()) {
      collectionsCache.invalidate(`${COLLECTION_CACHE_VERSION}:${userId}`);
      // Set expiry before starting the request so concurrent mounts share its promise
      // instead of repeatedly invalidating it while the first load is still pending.
      collectionsCacheExpiry.set(userId, Date.now() + COLLECTION_CACHE_TTL);
    }
    return collectionsCache.get(`${COLLECTION_CACHE_VERSION}:${userId}`, async () => {
      const [topicResult, lessonResult, allItems] = await Promise.all([
        supabase.from("communication_topics").select("*").order("sort_order").order("title_en"),
        supabase.from("communication_lessons").select("*").order("sort_order").order("title_en"),
        fetchAllPages<Item>(async (from, to) => {
          const { data, error } = await supabase
            .from("communication_lesson_items")
            .select("*")
            .order("sort_order")
            .order("item_key")
            .range(from, to);
          return { data: (data ?? []) as Item[], error };
        }),
      ]);
      if (topicResult.error) throw topicResult.error;
      if (lessonResult.error) throw lessonResult.error;
      return { topics: (topicResult.data ?? []) as Topic[], lessons: (lessonResult.data ?? []) as Lesson[], items: allItems };
    });
  }
  function applyCollections(next: { topics: Topic[]; lessons: Lesson[]; items: Item[] }) {
    setTopics(next.topics); setLessons(next.lessons); setItems(next.items);
    const nextTopicId = next.topics.some((topic) => topic.id === selectedTopicId) ? selectedTopicId : next.topics[0]?.id ?? "";
    setSelectedTopicId(nextTopicId);
    setSelectedLessonId((old) => next.lessons.some((lesson) => lesson.id === old && lesson.topic_id === nextTopicId)
      ? old
      : next.lessons.find((lesson) => lesson.topic_id === nextTopicId)?.id ?? "");
  }
  async function refresh() {
    try { applyCollections(await loadCollections(true)); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not load communication content."); }
  }
  useEffect(() => {
    let active = true;
    void loadCollections().then((result) => { if (active) applyCollections(result); })
      .catch((error: unknown) => { if (active) toast.error(error instanceof Error ? error.message : "Could not load communication content."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  // Initial load only; explicit refresh uses the same query helper.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveTopic(event: FormEvent) {
    event.preventDefault();
    const payload = { ...topicDraft, slug: topicDraft.slug.trim().toLowerCase().replaceAll(" ", "-"), title_en: topicDraft.title_en.trim(), title_vi: topicDraft.title_vi.trim() };
    if (!payload.slug || !payload.title_en || !payload.title_vi) return toast.error("Add a stable slug and both topic titles.");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) return toast.error("Use lowercase letters, numbers, and single hyphens in the situation slug.");
    setBusy(true);
    const query = topicEditing ? supabase.from("communication_topics").update(payload).eq("id", topicEditing) : supabase.from("communication_topics").insert(payload);
    const { error } = await query;
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(topicEditing ? "Topic updated." : "Topic added."); setTopicDraft({ slug: "", title_en: "", title_vi: "", description_en: "", description_vi: "", sort_order: topics.length + 1, status: "draft" }); setTopicEditing(null); await refresh();
  }
  function editTopic(topic: Topic) { setTopicEditing(topic.id); setTopicDraft({ slug: topic.slug, title_en: topic.title_en, title_vi: topic.title_vi, description_en: topic.description_en, description_vi: topic.description_vi, sort_order: topic.sort_order, status: topic.status }); }
  async function removeTopic(topic: Topic) {
    if (!await confirm({ title: "Remove situation?", description: `Remove “${topic.title_en}” and all its lessons and content?`, confirmLabel: "Remove" })) return;
    const { error } = await supabase.from("communication_topics").delete().eq("id", topic.id);
    if (error) toast.error(error.message); else { toast.success("Situation removed."); await refresh(); }
  }

  async function saveLesson(event: FormEvent) {
    event.preventDefault();
    const payload = { ...lessonDraft, topic_id: selectedTopicId, lesson_key: lessonDraft.lesson_key.trim(), title_en: lessonDraft.title_en.trim(), title_vi: lessonDraft.title_vi.trim() };
    if (!topics.some((topic) => topic.id === payload.topic_id) || !payload.lesson_key || !payload.title_en || !payload.title_vi) return toast.error("Select an existing situation and complete the lesson key and titles.");
    if (payload.lesson_key.length < 2 || payload.lesson_key.length > 80) return toast.error("The lesson key must be between 2 and 80 characters.");
    setBusy(true);
    const query = lessonEditing ? supabase.from("communication_lessons").update(payload).eq("id", lessonEditing) : supabase.from("communication_lessons").insert(payload);
    const { error } = await query;
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(lessonEditing ? "Lesson updated." : "Lesson added."); setLessonDraft({ ...initialLesson, topic_id: selectedTopicId, sort_order: currentLessons.length + 1 }); setLessonEditing(null); await refresh();
  }
  function editLesson(lesson: Lesson) { setSelectedLessonId(lesson.id); setLessonEditing(lesson.id); setLessonDraft({ topic_id: lesson.topic_id, lesson_key: lesson.lesson_key, title_en: lesson.title_en, title_vi: lesson.title_vi, difficulty: lesson.difficulty, sort_order: lesson.sort_order, status: lesson.status }); }
  async function removeLesson(lesson: Lesson) {
    if (!await confirm({ title: "Remove lesson?", description: `Remove “${lesson.title_en}” and its items and dialogues?`, confirmLabel: "Remove" })) return;
    const { error } = await supabase.from("communication_lessons").delete().eq("id", lesson.id);
    if (error) toast.error(error.message); else { toast.success("Lesson removed."); await refresh(); }
  }

  async function removeAllLessons() {
    if (!selectedTopicId || currentLessons.length === 0) return;
    const topicTitle = currentTopic?.title_en ?? "this situation";
    if (!await confirm({
      title: "Delete all lessons in this situation?",
      description: `Delete all ${currentLessons.length} lessons in “${topicTitle}”, including their items, dialogues, learner review history, and progress? This cannot be undone.`,
      confirmLabel: "Delete all lessons",
    })) return;
    setBusy(true);
    const { error } = await supabase.from("communication_lessons").delete().eq("topic_id", selectedTopicId);
    setBusy(false);
    if (error) return toast.error(error.message);
    setLessonEditing(null);
    setItemEditing(null);
    setLessonDraft({ ...initialLesson, topic_id: selectedTopicId });
    setItemDraft(initialItem);
    toast.success(`Deleted all lessons in “${topicTitle}”.`);
    await refresh();
  }

  async function saveItem(event: FormEvent) {
    event.preventDefault();
    const payload = { ...itemDraft, lesson_id: selectedLessonId, item_key: itemDraft.item_key.trim(), content_en: itemDraft.content_en.trim(), meaning_vi: itemDraft.meaning_vi.trim() };
    if (!lessons.some((lesson) => lesson.id === payload.lesson_id) || !payload.item_key || !payload.content_en || !payload.meaning_vi) return toast.error("Select an existing lesson and complete the item key, English content, and Vietnamese meaning.");
    if (payload.item_key.length < 2 || payload.item_key.length > 100) return toast.error("The item key must be between 2 and 100 characters.");
    if (Boolean(payload.example_en.trim()) !== Boolean(payload.example_vi.trim())) return toast.error("Provide both example translations, or leave both examples blank.");
    if (payload.item_type === "sentence_pattern" && (!payload.example_en.trim() || !payload.example_vi.trim())) return toast.error("Sentence patterns need an English example and its Vietnamese translation.");
    if (!isOptionalHttpUrl(payload.audio_url)) return toast.error("Audio URL must be a valid HTTP or HTTPS link.");
    setBusy(true);
    const query = itemEditing ? supabase.from("communication_lesson_items").update(payload).eq("id", itemEditing) : supabase.from("communication_lesson_items").insert(payload);
    const { error } = await query;
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(itemEditing ? "Learning item updated." : "Learning item added."); setItemDraft({ ...initialItem, lesson_id: selectedLessonId, sort_order: currentItems.length + 1 }); setItemEditing(null); await refresh();
  }
  function editItem(item: Item) { setItemEditing(item.id); setItemDraft({ lesson_id: item.lesson_id, item_key: item.item_key, item_type: item.item_type, content_en: item.content_en, meaning_vi: item.meaning_vi, example_en: item.example_en, example_vi: item.example_vi, image_keyword: item.image_keyword, audio_url: item.audio_url, sort_order: item.sort_order }); }
  async function removeItem(item: Item) {
    if (!await confirm({ title: "Remove learning item?", description: `Remove “${item.content_en}” from this lesson?`, confirmLabel: "Remove" })) return;
    const { error } = await supabase.from("communication_lesson_items").delete().eq("id", item.id);
    if (error) toast.error(error.message); else { toast.success("Learning item removed."); await refresh(); }
  }

  async function removeAllItems() {
    if (!selectedLessonId || currentItems.length === 0) return;
    const lessonTitle = lessons.find((lesson) => lesson.id === selectedLessonId)?.title_en ?? "this lesson";
    if (!await confirm({
      title: "Delete all items in this lesson?",
      description: `Delete all ${currentItems.length} vocabulary items from “${lessonTitle}”? Learners’ review data for these items will also be deleted.`,
      confirmLabel: "Delete all items",
    })) return;
    setBusy(true);
    const { error } = await supabase.from("communication_lesson_items").delete().eq("lesson_id", selectedLessonId);
    setBusy(false);
    if (error) return toast.error(error.message);
    setItemEditing(null);
    setItemDraft({ ...initialItem, lesson_id: selectedLessonId });
    toast.success(`Deleted all items from “${lessonTitle}”.`);
    await refresh();
  }

  async function importCsv(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const parsed = parseCommunicationCsvDetailed(await file.text());
      const records = parsed.records;
      if (!records.length) {
        toast.info(parsed.duplicates.length ? `No new rows to import. Skipped ${parsed.duplicates.length} duplicate CSV rows.` : "The CSV has no content rows.");
        return;
      }
      const topicsBySlug = new Map<string, string>();
      const lessonsByKey = new Map<string, string>();
      const dialoguesByKey = new Map<string, string>();
      const topicRows = [...new Map(records.map((row) => [row.topic_slug, { slug: row.topic_slug, title_en: row.topic_title_en, title_vi: row.topic_title_vi, description_en: row.topic_description_en, description_vi: row.topic_description_vi, sort_order: row.topic_order, status: "published" as ContentStatus }])).values()];
      const result = await supabase.from("communication_topics").select("slug").in("slug", topicRows.map((row) => row.slug));
      if (result.error) throw result.error;
      const existingTopicSlugs = new Set((result.data ?? []).map((row) => row.slug));
      const newTopicRows = topicRows.filter((row) => !existingTopicSlugs.has(row.slug));
      if (newTopicRows.length) {
        const insertTopics = await supabase.from("communication_topics").insert(newTopicRows);
        if (insertTopics.error) throw insertTopics.error;
      }
      const lookup = await supabase.from("communication_topics").select("id,slug").in("slug", topicRows.map((row) => row.slug));
      if (lookup.error) throw lookup.error;
      for (const row of lookup.data ?? []) topicsBySlug.set(row.slug, row.id);
      const lessonRows = [...new Map(records.map((row) => [row.lesson_key, { lesson_key: row.lesson_key, topic_id: topicsBySlug.get(row.topic_slug), title_en: row.lesson_title_en, title_vi: row.lesson_title_vi, difficulty: row.difficulty, sort_order: row.lesson_order, status: row.lesson_status }])).values()];
      if (lessonRows.some((row) => !row.topic_id)) throw new Error("Import references a topic that could not be resolved.");
      const existingLessonsResult = await supabase.from("communication_lessons").select("lesson_key").in("lesson_key", lessonRows.map((row) => row.lesson_key));
      if (existingLessonsResult.error) throw existingLessonsResult.error;
      const existingLessonKeys = new Set((existingLessonsResult.data ?? []).map((row) => row.lesson_key));
      const newLessonRows = lessonRows.filter((row) => !existingLessonKeys.has(row.lesson_key));
      if (newLessonRows.length) {
        const insertLessons = await supabase.from("communication_lessons").insert(newLessonRows);
        if (insertLessons.error) throw insertLessons.error;
      }
      const lessonLookup = await supabase.from("communication_lessons").select("id,lesson_key").in("lesson_key", lessonRows.map((row) => row.lesson_key));
      if (lessonLookup.error) throw lessonLookup.error;
      for (const row of lessonLookup.data ?? []) lessonsByKey.set(row.lesson_key, row.id);

      const allItemRows = records.filter((row) => row.record_type === "item").map((row) => ({ item_key: row.record_key, lesson_id: lessonsByKey.get(row.lesson_key), item_type: row.item_type, content_en: row.content_en, meaning_vi: row.meaning_vi, example_en: row.example_en, example_vi: row.example_vi, image_keyword: row.image_keyword, audio_url: row.audio_url, sort_order: row.record_order }));
      const itemKeys = allItemRows.map((row) => row.item_key);
      const existingItemsResult = itemKeys.length ? await supabase.from("communication_lesson_items").select("item_key").in("item_key", itemKeys) : { data: [], error: null };
      if (existingItemsResult.error) throw existingItemsResult.error;
      const existingItemKeys = new Set((existingItemsResult.data ?? []).map((row) => row.item_key));
      const itemRows = allItemRows.filter((row) => !existingItemKeys.has(row.item_key));
      const skippedExistingContentRows = records.filter((row) => row.record_type === "item" && existingItemKeys.has(row.record_key)).length;
      if (itemRows.length) {
        const insertItems = await supabase.from("communication_lesson_items").insert(itemRows);
        if (insertItems.error) throw insertItems.error;
      }
      const dialogueRecords = records.filter((row) => row.record_type === "dialogue_turn");
      const allDialogueRows = [...new Map(dialogueRecords.map((row) => [row.dialogue_key, { dialogue_key: row.dialogue_key, lesson_id: lessonsByKey.get(row.lesson_key), title_en: row.dialogue_title_en, title_vi: row.dialogue_title_vi, prompt_vi: row.dialogue_prompt_vi, sort_order: row.record_order }])).values()];
      const dialogueKeys = allDialogueRows.map((row) => row.dialogue_key);
      const existingDialoguesResult = dialogueKeys.length ? await supabase.from("communication_dialogues").select("dialogue_key").in("dialogue_key", dialogueKeys) : { data: [], error: null };
      if (existingDialoguesResult.error) throw existingDialoguesResult.error;
      const existingDialogueKeys = new Set((existingDialoguesResult.data ?? []).map((row) => row.dialogue_key));
      const dialogueRows = allDialogueRows.filter((row) => !existingDialogueKeys.has(row.dialogue_key));
      if (dialogueRows.length) {
        const insertDialogues = await supabase.from("communication_dialogues").insert(dialogueRows);
        if (insertDialogues.error) throw insertDialogues.error;
      }
      let skippedExistingTurns = 0;
      const skippedExistingTurnKeys = new Set<string>();
      let turnRows: Array<{ turn_key: string; dialogue_id: string | undefined; turn_order: number | null; speaker: string; text_en: string; meaning_vi: string; audio_url: string; response_prompt_vi: string; expected_response: string; response_options: string[] }> = [];
      if (dialogueRecords.length) {
        const dialogueLookup = await supabase.from("communication_dialogues").select("id,dialogue_key").in("dialogue_key", dialogueKeys);
        if (dialogueLookup.error) throw dialogueLookup.error;
        for (const row of dialogueLookup.data ?? []) dialoguesByKey.set(row.dialogue_key, row.id);
        const allTurnRows = dialogueRecords.map((row) => ({ turn_key: row.record_key, dialogue_id: dialoguesByKey.get(row.dialogue_key), turn_order: row.turn_order, speaker: row.speaker, text_en: row.turn_text_en, meaning_vi: row.turn_meaning_vi, audio_url: row.turn_audio_url, response_prompt_vi: row.response_prompt_vi, expected_response: row.expected_response, response_options: row.response_options }));
        const turnKeys = allTurnRows.map((row) => row.turn_key);
        const dialogueIds = [...new Set(dialogueRecords.map((row) => dialoguesByKey.get(row.dialogue_key)).filter((id): id is string => Boolean(id)))];
        const existingTurnsResult = dialogueIds.length ? await supabase.from("communication_dialogue_turns").select("turn_key,dialogue_id,turn_order").in("dialogue_id", dialogueIds) : { data: [], error: null };
        if (existingTurnsResult.error) throw existingTurnsResult.error;
        const existingTurnKeys = new Set((existingTurnsResult.data ?? []).map((row) => row.turn_key));
        const existingTurnOrders = new Set((existingTurnsResult.data ?? []).map((row) => `${row.dialogue_id}:${row.turn_order}`));
        for (const row of dialogueRecords) {
          const dialogueId = dialoguesByKey.get(row.dialogue_key);
          if (existingTurnKeys.has(row.record_key) || (dialogueId && existingTurnOrders.has(`${dialogueId}:${row.turn_order}`))) {
            skippedExistingTurnKeys.add(row.record_key);
          }
        }
        turnRows = allTurnRows.filter((row) => !skippedExistingTurnKeys.has(row.turn_key));
        skippedExistingTurns = skippedExistingTurnKeys.size;
        if (turnRows.length) {
          const insertTurns = await supabase.from("communication_dialogue_turns").insert(turnRows);
          if (insertTurns.error) throw insertTurns.error;
        }
      }
      const skipped = parsed.duplicates.length + skippedExistingContentRows + skippedExistingTurns;
      const imported = itemRows.length + turnRows.length;
      const skippedRowNumbers = [
        ...parsed.duplicates.map((duplicate) => duplicate.row),
        ...records.flatMap((row, index) =>
          (row.record_type === "item" && existingItemKeys.has(row.record_key)) ||
          (row.record_type === "dialogue_turn" && skippedExistingTurnKeys.has(row.record_key))
            ? [parsed.recordRows[index]] : []),
      ].sort((a, b) => a - b);
      if (skipped) {
        const rowDetails = skippedRowNumbers.length ? ` Skipped CSV rows: ${[...new Set(skippedRowNumbers)].join(", ")}.` : "";
        toast.success(`Imported ${imported} new rows (${itemRows.length} items, ${turnRows.length} dialogue turns). Skipped ${skipped} duplicate rows.${rowDetails}`);
      } else {
        toast.success(`Imported ${imported} rows (${itemRows.length} items, ${turnRows.length} dialogue turns).`);
      }
      await refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "CSV import failed."); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function exportCsv() {
    setBusy(true);
    try {
      const [topicResult, lessonResult, allItems, allDialogues, allTurns] = await Promise.all([
        supabase.from("communication_topics").select("*"), supabase.from("communication_lessons").select("*"),
        fetchAllPages<Item>(async (from, to) => {
          const { data, error } = await supabase
            .from("communication_lesson_items")
            .select("*")
            .order("sort_order")
            .order("item_key")
            .range(from, to);
          return { data: (data ?? []) as Item[], error };
        }),
        fetchAllPages<ExportDialogue>(async (from, to) => {
          const { data, error } = await supabase
            .from("communication_dialogues")
            .select("*")
            .order("dialogue_key")
            .range(from, to);
          return { data: (data ?? []) as ExportDialogue[], error };
        }),
        fetchAllPages<ExportTurn>(async (from, to) => {
          const { data, error } = await supabase
            .from("communication_dialogue_turns")
            .select("*")
            .order("turn_key")
            .range(from, to);
          return { data: (data ?? []) as ExportTurn[], error };
        }),
      ]);
      const error = topicResult.error ?? lessonResult.error;
      if (error) throw error;
      const topicMap = new Map((topicResult.data ?? []).map((row) => [row.id, row]));
      const lessonMap = new Map((lessonResult.data ?? []).map((row) => [row.id, row]));
      const common = (lessonId: string) => {
        const lesson = lessonMap.get(lessonId); const topic = lesson ? topicMap.get(lesson.topic_id) : null;
        if (!lesson || !topic) return null;
        return { topic_slug: topic.slug, topic_title_en: topic.title_en, topic_title_vi: topic.title_vi, topic_description_en: topic.description_en, topic_description_vi: topic.description_vi, topic_order: topic.sort_order, lesson_key: lesson.lesson_key, lesson_title_en: lesson.title_en, lesson_title_vi: lesson.title_vi, difficulty: lesson.difficulty, lesson_order: lesson.sort_order, lesson_status: lesson.status };
      };
      const records: CommunicationCsvRecord[] = [];
      for (const item of allItems) {
        const details = common(item.lesson_id); if (!details) continue;
        records.push({ record_type: "item", ...details, record_key: item.item_key, record_order: item.sort_order, item_type: item.item_type, content_en: item.content_en, meaning_vi: item.meaning_vi, example_en: item.example_en, example_vi: item.example_vi, image_keyword: item.image_keyword, audio_url: item.audio_url, dialogue_key: "", dialogue_title_en: "", dialogue_title_vi: "", dialogue_prompt_vi: "", speaker: "", turn_order: null, turn_text_en: "", turn_meaning_vi: "", turn_audio_url: "", response_prompt_vi: "", expected_response: "", response_options: [] });
      }
      const dialogueMap = new Map(allDialogues.map((dialogue) => [dialogue.id, dialogue]));
      for (const turn of allTurns) {
        const dialogue = dialogueMap.get(turn.dialogue_id); const details = dialogue ? common(dialogue.lesson_id) : null;
        if (!dialogue || !details) continue;
        records.push({ record_type: "dialogue_turn", ...details, record_key: turn.turn_key, record_order: dialogue.sort_order, item_type: "", content_en: "", meaning_vi: "", example_en: "", example_vi: "", image_keyword: "", audio_url: "", dialogue_key: dialogue.dialogue_key, dialogue_title_en: dialogue.title_en, dialogue_title_vi: dialogue.title_vi, dialogue_prompt_vi: dialogue.prompt_vi, speaker: turn.speaker, turn_order: turn.turn_order, turn_text_en: turn.text_en, turn_meaning_vi: turn.meaning_vi, turn_audio_url: turn.audio_url, response_prompt_vi: turn.response_prompt_vi, expected_response: turn.expected_response, response_options: turn.response_options });
      }
      const blob = new Blob(["\uFEFF", exportCommunicationCsv(records)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "BlueWords_Situational_English.csv"; link.click(); URL.revokeObjectURL(url);
      toast.success(`Exported ${records.length} content rows.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not export communication content."); }
    finally { setBusy(false); }
  }

  return <main className="space-y-5">
    <header className="rounded-3xl border border-sky-100 bg-gradient-to-r from-white via-sky-50 to-cyan-100 p-5 sm:p-7">
      <p className="text-sm font-bold text-blue-600">Administration</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4"><div><h1 className="page-title text-3xl">Situational English</h1><p className="page-intro-description mt-2">Build lessons that connect vocabulary, useful phrases, sentence patterns, and conversations.</p></div>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void refresh()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 text-sm font-semibold text-blue-700"><RefreshCw size={16}/> Refresh</button><button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 text-sm font-semibold text-blue-700"><FileUp size={16}/> Import CSV</button><input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void importCsv(event.target.files?.[0])}/><button type="button" disabled={busy} onClick={() => void exportCsv()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white"><Download size={16}/> Export CSV</button></div>
      </div>
    </header>

    <section className="grid gap-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.6fr)]">
      <div className="space-y-5">
        <form onSubmit={(event) => void saveTopic(event)} className="rounded-3xl border border-sky-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">{topicEditing ? "Edit situation" : "Add a situation"}</h2>{topicEditing && <button type="button" className="text-sm font-semibold text-slate-500" onClick={() => { setTopicEditing(null); setTopicDraft({ slug: "", title_en: "", title_vi: "", description_en: "", description_vi: "", sort_order: topics.length + 1, status: "draft" }); }}>Cancel</button>}</div>
          <div className="grid gap-3"><label className="text-xs font-bold text-slate-600">Slug<input className={inputClass} value={topicDraft.slug} onChange={(e) => setTopicDraft({ ...topicDraft, slug: e.target.value })} placeholder="food-restaurants" disabled={Boolean(topicEditing)}/></label><label className="text-xs font-bold text-slate-600">English title<input className={inputClass} value={topicDraft.title_en} onChange={(e) => setTopicDraft({ ...topicDraft, title_en: e.target.value })} placeholder="Food and restaurants"/></label><label className="text-xs font-bold text-slate-600">Vietnamese title<input className={inputClass} value={topicDraft.title_vi} onChange={(e) => setTopicDraft({ ...topicDraft, title_vi: e.target.value })} placeholder="Đồ ăn và nhà hàng"/></label><label className="text-xs font-bold text-slate-600">English description<input className={inputClass} value={topicDraft.description_en} onChange={(e) => setTopicDraft({ ...topicDraft, description_en: e.target.value })}/></label><label className="text-xs font-bold text-slate-600">Vietnamese description<input className={inputClass} value={topicDraft.description_vi} onChange={(e) => setTopicDraft({ ...topicDraft, description_vi: e.target.value })}/></label><div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-slate-600">Order<input className={inputClass} type="number" min="0" value={topicDraft.sort_order} onChange={(e) => setTopicDraft({ ...topicDraft, sort_order: Number(e.target.value) })}/></label><label className="text-xs font-bold text-slate-600">Status<Select className="!mt-1 !h-11 !rounded-xl !border-sky-200 !text-sm" value={topicDraft.status} onChange={(e) => setTopicDraft({ ...topicDraft, status: e.target.value as ContentStatus })}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select></label></div><button disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white"><Plus size={17}/>{topicEditing ? "Save situation" : "Add situation"}</button></div>
        </form>
        <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm"><div className="border-b border-slate-100 p-4"><h2 className="font-bold text-slate-900">Situations <span className="text-slate-500">({topics.length})</span></h2><input aria-label="Search situations" className={inputClass} value={topicSearch} onChange={(e) => setTopicSearch(e.target.value)} placeholder="Search situations…"/></div>{loading ? <p className="p-6 text-sm text-slate-500">Loading…</p> : <div className="max-h-[34rem] divide-y divide-slate-100 overflow-y-auto">{filteredTopics.map((topic) => { const lessonCount = lessons.filter((lesson) => lesson.topic_id === topic.id).length; const wordCounts = topicWordCounts.get(topic.id) ?? { easy: 0, medium: 0, hard: 0 }; return <article key={topic.id} className={`flex items-center gap-2 p-3 ${selectedTopicId === topic.id ? "bg-blue-50" : ""}`}><button type="button" onClick={() => { const firstLessonId = lessons.find((lesson) => lesson.topic_id === topic.id)?.id ?? ""; setSelectedTopicId(topic.id); setSelectedLessonId(firstLessonId); setLessonEditing(null); setLessonDraft({ ...initialLesson, topic_id: topic.id }); setItemEditing(null); setItemDraft({ ...initialItem, lesson_id: firstLessonId }); }} className="min-w-0 flex-1 text-left"><span className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-900"><span className="truncate">{topic.title_en}</span><span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-blue-700">{lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}</span></span><span className="block truncate text-xs text-slate-500">{topic.title_vi} · {topic.status}</span><span className="mt-0.5 block text-[11px] font-semibold text-blue-700">Words · Easy {wordCounts.easy} / Medium {wordCounts.medium} / Hard {wordCounts.hard}</span></button><button type="button" aria-label={`Edit ${topic.title_en}`} onClick={() => editTopic(topic)} className="grid size-9 shrink-0 place-items-center rounded-lg border border-blue-100 text-blue-700"><Pencil size={15}/></button><button type="button" aria-label={`Remove ${topic.title_en}`} onClick={() => void removeTopic(topic)} className="grid size-9 shrink-0 place-items-center rounded-lg border border-rose-100 text-rose-600"><Trash2 size={15}/></button></article>; })}</div>}</section>
      </div>

      <div className="space-y-5">
        <form onSubmit={(event) => void saveLesson(event)} className="rounded-3xl border border-sky-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900">{lessonEditing ? "Edit lesson" : "Add a lesson"}</h2><p className="mt-1 text-sm text-slate-500">{currentTopic?.title_en ?? "Select a situation first."}</p></div>{lessonEditing && <button type="button" className="text-sm font-semibold text-slate-500" onClick={() => { setLessonEditing(null); setLessonDraft({ ...initialLesson, topic_id: selectedTopicId }); }}>Cancel</button>}</div>
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-600">Lesson key<input className={inputClass} value={lessonDraft.lesson_key} onChange={(e) => setLessonDraft({ ...lessonDraft, lesson_key: e.target.value })} placeholder="restaurant-booking-easy" disabled={Boolean(lessonEditing)}/></label><label className="text-xs font-bold text-slate-600">Difficulty<Select className="!mt-1 !h-11 !rounded-xl !border-sky-200 !text-sm" value={lessonDraft.difficulty} onChange={(e) => setLessonDraft({ ...lessonDraft, difficulty: e.target.value as CommunicationDifficulty })}><option value="easy">Easy · Dễ</option><option value="medium">Medium · Trung bình</option><option value="hard">Hard · Khó</option></Select></label><label className="text-xs font-bold text-slate-600">English title<input className={inputClass} value={lessonDraft.title_en} onChange={(e) => setLessonDraft({ ...lessonDraft, title_en: e.target.value })} placeholder="Booking a table"/></label><label className="text-xs font-bold text-slate-600">Vietnamese title<input className={inputClass} value={lessonDraft.title_vi} onChange={(e) => setLessonDraft({ ...lessonDraft, title_vi: e.target.value })} placeholder="Đặt bàn"/></label><label className="text-xs font-bold text-slate-600">Order<input className={inputClass} type="number" min="0" value={lessonDraft.sort_order} onChange={(e) => setLessonDraft({ ...lessonDraft, sort_order: Number(e.target.value) })}/></label><label className="text-xs font-bold text-slate-600">Status<Select className="!mt-1 !h-11 !rounded-xl !border-sky-200 !text-sm" value={lessonDraft.status} onChange={(e) => setLessonDraft({ ...lessonDraft, status: e.target.value as ContentStatus })}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select></label><button disabled={busy || !selectedTopicId} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white sm:col-span-2"><Plus size={17}/>{lessonEditing ? "Save lesson" : "Add lesson"}</button></div>
        </form>
        <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><div><h2 className="font-bold text-slate-900">Lessons <span className="text-slate-500">({currentLessons.length})</span></h2><p className="mt-1 text-sm text-slate-500">Select a lesson to manage its words, phrases, and sentence patterns.</p></div><div className="flex w-full flex-wrap gap-2 sm:w-auto"><Select aria-label="Select situation" containerClassName="min-w-0 flex-1 sm:w-64 sm:flex-none" className="!h-11 !rounded-xl !border-sky-200 !text-sm" value={selectedTopicId} onChange={(e) => { const topicId = e.target.value; const firstLessonId = lessons.find((lesson) => lesson.topic_id === topicId)?.id ?? ""; setSelectedTopicId(topicId); setSelectedLessonId(firstLessonId); setLessonEditing(null); setLessonDraft({ ...initialLesson, topic_id: topicId }); setItemEditing(null); setItemDraft({ ...initialItem, lesson_id: firstLessonId }); }}><option value="">Select situation</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.title_en}</option>)}</Select>{currentLessons.length > 0 && <button type="button" disabled={busy} onClick={() => void removeAllLessons()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 disabled:opacity-50"><Trash2 size={15}/> Delete all lessons</button>}</div></div>{!selectedTopicId ? <p className="p-6 text-sm text-slate-500">Add or select a situation.</p> : currentLessons.length === 0 ? <p className="p-6 text-sm text-slate-500">No lessons yet for this situation.</p> : <div className="divide-y divide-slate-100">{currentLessons.map((lesson) => <article key={lesson.id} className={`flex flex-wrap items-center gap-2 p-3 ${selectedLessonId === lesson.id ? "bg-blue-50/70" : ""}`}><button type="button" onClick={() => { setSelectedLessonId(lesson.id); setItemDraft({ ...initialItem, lesson_id: lesson.id }); setItemEditing(null); }} className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-bold text-slate-900">{lesson.title_en} <span className="font-medium capitalize text-blue-700">· {lesson.difficulty}</span></span><span className="block truncate text-xs text-slate-500">{lesson.title_vi} · {lesson.status} · {items.filter((item) => item.lesson_id === lesson.id).length} items</span></button><button type="button" aria-label={`Edit ${lesson.title_en}`} onClick={() => editLesson(lesson)} className="grid size-9 place-items-center rounded-lg border border-blue-100 text-blue-700"><Pencil size={15}/></button><button type="button" aria-label={`Remove ${lesson.title_en}`} onClick={() => void removeLesson(lesson)} className="grid size-9 place-items-center rounded-lg border border-rose-100 text-rose-600"><Trash2 size={15}/></button></article>)}</div>}</section>

        <form onSubmit={(event) => void saveItem(event)} className="rounded-3xl border border-sky-100 bg-white p-4 shadow-sm sm:p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900">{itemEditing ? "Edit learning item" : "Add a learning item"}</h2><p className="mt-1 text-sm text-slate-500">Items connect words, useful phrases, and sentence patterns.</p></div>{itemEditing && <button type="button" className="text-sm font-semibold text-slate-500" onClick={() => { setItemEditing(null); setItemDraft({ ...initialItem, lesson_id: selectedLessonId }); }}>Cancel</button>}</div><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-600">Item key<input className={inputClass} value={itemDraft.item_key} onChange={(e) => setItemDraft({ ...itemDraft, item_key: e.target.value })} placeholder="reservation-phrase" disabled={Boolean(itemEditing)}/></label><label className="text-xs font-bold text-slate-600">Type<Select className="!mt-1 !h-11 !rounded-xl !border-sky-200 !text-sm" value={itemDraft.item_type} onChange={(e) => setItemDraft({ ...itemDraft, item_type: e.target.value as ItemDraft["item_type"] })}><option value="word">Word</option><option value="phrase">Useful phrase</option><option value="sentence_pattern">Sentence pattern</option></Select></label><label className="text-xs font-bold text-slate-600">English content<input className={inputClass} value={itemDraft.content_en} onChange={(e) => setItemDraft({ ...itemDraft, content_en: e.target.value })} placeholder="make a reservation"/></label><label className="text-xs font-bold text-slate-600">Vietnamese meaning<input className={inputClass} value={itemDraft.meaning_vi} onChange={(e) => setItemDraft({ ...itemDraft, meaning_vi: e.target.value })} placeholder="đặt chỗ"/></label><label className="text-xs font-bold text-slate-600">Example in English<input className={inputClass} value={itemDraft.example_en} onChange={(e) => setItemDraft({ ...itemDraft, example_en: e.target.value })} placeholder="I'd like to make a reservation."/></label><label className="text-xs font-bold text-slate-600">Example in Vietnamese<input className={inputClass} value={itemDraft.example_vi} onChange={(e) => setItemDraft({ ...itemDraft, example_vi: e.target.value })} placeholder="Tôi muốn đặt bàn."/></label><label className="text-xs font-bold text-slate-600">Image keyword<input className={inputClass} value={itemDraft.image_keyword} onChange={(e) => setItemDraft({ ...itemDraft, image_keyword: e.target.value })} placeholder="restaurant table"/></label><label className="text-xs font-bold text-slate-600">Audio URL<input className={inputClass} type="url" value={itemDraft.audio_url} onChange={(e) => setItemDraft({ ...itemDraft, audio_url: e.target.value })} placeholder="https://…"/></label><label className="text-xs font-bold text-slate-600">Order<input className={inputClass} type="number" min="0" value={itemDraft.sort_order} onChange={(e) => setItemDraft({ ...itemDraft, sort_order: Number(e.target.value) })}/></label><button disabled={busy || !selectedLessonId} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white"><Plus size={17}/>{itemEditing ? "Save item" : "Add item"}</button></div><p className="mt-3 text-xs text-slate-500">Dialogue scenarios and turns are included in the CSV import/export format.</p></form>
        <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><div><h2 className="font-bold text-slate-900">Lesson content <span className="text-slate-500">({currentItems.length})</span></h2><p className="mt-1 text-sm text-slate-500">{lessons.find((lesson) => lesson.id === selectedLessonId)?.title_en ?? "Select a lesson above."}</p></div>{currentItems.length > 0 && <button type="button" disabled={busy} onClick={() => void removeAllItems()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 disabled:opacity-50"><Trash2 size={15}/> Delete all items</button>}</div>{!selectedLessonId ? <p className="p-6 text-sm text-slate-500">Select a lesson to see its items.</p> : currentItems.length === 0 ? <p className="p-6 text-sm text-slate-500">No learning items yet.</p> : <div className="divide-y divide-slate-100">{currentItems.map((item) => <article key={item.id} className="flex flex-wrap items-center gap-2 p-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-slate-900">{item.content_en}</strong><span className="rounded-full bg-blue-50 px-2 py-1 text-xs capitalize text-blue-700">{item.item_type.replace("_", " ")}</span></div><p className="mt-1 text-sm text-slate-500">{item.meaning_vi}{item.example_en ? ` · ${item.example_en}` : ""}</p></div><button type="button" onClick={() => editItem(item)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-blue-200 px-3 text-sm font-semibold text-blue-700"><Pencil size={15}/> Edit</button><button type="button" onClick={() => void removeItem(item)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700"><Trash2 size={15}/> Remove</button></article>)}</div>}</section>
      </div>
    </section>
  </main>;
}
