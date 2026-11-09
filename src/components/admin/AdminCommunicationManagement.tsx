"use client";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";

import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";
import { getCommunicationTopicWordCounts } from "@/lib/communication/topic-word-counts";
import { useAdminCommunicationCollections } from "@/hooks/useAdminCommunicationCollections";
import { AdminCommunicationTopicList } from "@/components/admin/AdminCommunicationTopicList";
import { AdminCommunicationLessonList } from "@/components/admin/AdminCommunicationLessonList";
import { AdminCommunicationLessonContentList } from "@/components/admin/AdminCommunicationLessonContentList";
import { AdminCommunicationTopicForm, type CommunicationTopicDraft } from "@/components/admin/AdminCommunicationTopicForm";
import { AdminCommunicationLessonForm, type CommunicationLessonDraft } from "@/components/admin/AdminCommunicationLessonForm";
import { AdminCommunicationItemForm, type CommunicationItemDraft } from "@/components/admin/AdminCommunicationItemForm";
import { AdminCommunicationCsvActions } from "@/components/admin/AdminCommunicationCsvActions";
import type { CommunicationLesson, CommunicationLessonItem, CommunicationTopic } from "@/lib/supabase/communication-admin-types";

type Topic = CommunicationTopic;
type Lesson = CommunicationLesson;
type Item = CommunicationLessonItem;
type LessonDraft = CommunicationLessonDraft;
type ItemDraft = CommunicationItemDraft;
const initialLesson: LessonDraft = { topic_id: "", lesson_key: "", title_en: "", title_vi: "", difficulty: "easy", sort_order: 1, status: "draft" };
const initialItem: ItemDraft = { lesson_id: "", item_key: "", item_type: "word", content_en: "", meaning_vi: "", example_en: "", example_vi: "", image_keyword: "", audio_url: "", sort_order: 1 };
function isOptionalHttpUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch { return false; }
}

export function AdminCommunicationManagement() {
  const supabase = useSupabaseClient();
  const {
    topics,
    lessons,
    items,
    selectedTopicId,
    setSelectedTopicId,
    selectedLessonId,
    setSelectedLessonId,
    loading,
    refresh,
  } = useAdminCommunicationCollections(supabase);
  const [topicDraft, setTopicDraft] = useState<CommunicationTopicDraft>({ slug: "", title_en: "", title_vi: "", description_en: "", description_vi: "", sort_order: 1, status: "draft" });
  const [topicEditing, setTopicEditing] = useState<string | null>(null);
  const [lessonDraft, setLessonDraft] = useState<LessonDraft>(initialLesson);
  const [lessonEditing, setLessonEditing] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState<ItemDraft>(initialItem);
  const [itemEditing, setItemEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [topicSearch, setTopicSearch] = useState("");
  const confirm = useConfirmDialog();
  const currentTopic = topics.find((topic) => topic.id === selectedTopicId) ?? null;
  const currentLessons = lessons.filter((lesson) => lesson.topic_id === selectedTopicId);
  const currentItems = items.filter((item) => item.lesson_id === selectedLessonId);
  const filteredTopics = topics.filter((topic) => `${topic.title_en} ${topic.title_vi} ${topic.slug}`.toLowerCase().includes(topicSearch.toLowerCase()));
  const topicWordCounts = useMemo(() => getCommunicationTopicWordCounts(lessons, items), [items, lessons]);

  function selectTopic(topicId: string) {
    const firstLessonId = lessons.find((lesson) => lesson.topic_id === topicId)?.id ?? "";
    setSelectedTopicId(topicId);
    setSelectedLessonId(firstLessonId);
    setLessonEditing(null);
    setLessonDraft({ ...initialLesson, topic_id: topicId });
    setItemEditing(null);
    setItemDraft({ ...initialItem, lesson_id: firstLessonId });
  }

  function selectLesson(lesson: Lesson) {
    setSelectedLessonId(lesson.id);
    setItemDraft({ ...initialItem, lesson_id: lesson.id });
    setItemEditing(null);
  }

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

  return <main className="space-y-5">
    <header className="rounded-3xl border border-sky-100 bg-gradient-to-r from-white via-sky-50 to-cyan-100 p-5 sm:p-7">
      <p className="text-sm font-bold text-blue-600">Administration</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4"><div><h1 className="page-title text-3xl">Situational English</h1><p className="page-intro-description mt-2">Build lessons that connect vocabulary, useful phrases, sentence patterns, and conversations.</p></div>
      <AdminCommunicationCsvActions supabase={supabase} selectedTopicId={selectedTopicId} busy={busy} setBusy={setBusy} onRefresh={refresh} />
      </div>
    </header>

    <section className="grid gap-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.6fr)]">
      <div className="space-y-5">
        <AdminCommunicationTopicForm
          draft={topicDraft}
          editing={Boolean(topicEditing)}
          busy={busy}
          onDraftChange={setTopicDraft}
          onSubmit={(event) => void saveTopic(event)}
          onCancel={() => {
            setTopicEditing(null);
            setTopicDraft({ slug: "", title_en: "", title_vi: "", description_en: "", description_vi: "", sort_order: topics.length + 1, status: "draft" });
          }}
        />
        <AdminCommunicationTopicList
          topics={filteredTopics}
          totalCount={topics.length}
          lessons={lessons}
          wordCounts={topicWordCounts}
          selectedTopicId={selectedTopicId}
          search={topicSearch}
          loading={loading}
          onSearchChange={setTopicSearch}
          onSelect={selectTopic}
          onEdit={editTopic}
          onRemove={(topic) => void removeTopic(topic)}
        />
      </div>

      <div className="space-y-5">
        <AdminCommunicationLessonForm
          draft={lessonDraft}
          editing={Boolean(lessonEditing)}
          busy={busy}
          enabled={Boolean(selectedTopicId)}
          topicTitle={currentTopic?.title_en ?? null}
          onDraftChange={setLessonDraft}
          onSubmit={(event) => void saveLesson(event)}
          onCancel={() => {
            setLessonEditing(null);
            setLessonDraft({ ...initialLesson, topic_id: selectedTopicId });
          }}
        />
        <AdminCommunicationLessonList
          topics={topics}
          lessons={currentLessons}
          items={items}
          selectedTopicId={selectedTopicId}
          selectedLessonId={selectedLessonId}
          busy={busy}
          onSelectTopic={selectTopic}
          onSelectLesson={selectLesson}
          onEdit={editLesson}
          onRemove={(lesson) => void removeLesson(lesson)}
          onDeleteAll={() => void removeAllLessons()}
        />

        <AdminCommunicationItemForm
          draft={itemDraft}
          editing={Boolean(itemEditing)}
          busy={busy}
          enabled={Boolean(selectedLessonId)}
          onDraftChange={setItemDraft}
          onSubmit={(event) => void saveItem(event)}
          onCancel={() => {
            setItemEditing(null);
            setItemDraft({ ...initialItem, lesson_id: selectedLessonId });
          }}
        />
        <AdminCommunicationLessonContentList
          items={currentItems}
          lessonTitle={lessons.find((lesson) => lesson.id === selectedLessonId)?.title_en ?? null}
          selectedLessonId={selectedLessonId}
          busy={busy}
          onDeleteAll={() => void removeAllItems()}
          onEdit={editItem}
          onRemove={(item) => void removeItem(item)}
        />
      </div>
    </section>
  </main>;
}
