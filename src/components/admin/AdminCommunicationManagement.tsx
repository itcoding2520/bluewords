"use client";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";
import { getCommunicationTopicWordCounts } from "@/lib/communication/topic-word-counts";
import { useAdminCommunicationCollections } from "@/hooks/useAdminCommunicationCollections";
import { useAdminCommunicationTopicActions } from "@/hooks/useAdminCommunicationTopicActions";
import { useAdminCommunicationLessonActions } from "@/hooks/useAdminCommunicationLessonActions";
import { useAdminCommunicationItemActions } from "@/hooks/useAdminCommunicationItemActions";
import { AdminCommunicationTopicList } from "@/components/admin/AdminCommunicationTopicList";
import { AdminCommunicationLessonList } from "@/components/admin/AdminCommunicationLessonList";
import { AdminCommunicationLessonContentList } from "@/components/admin/AdminCommunicationLessonContentList";
import { AdminCommunicationTopicForm, type CommunicationTopicDraft } from "@/components/admin/AdminCommunicationTopicForm";
import { AdminCommunicationLessonForm, type CommunicationLessonDraft } from "@/components/admin/AdminCommunicationLessonForm";
import { AdminCommunicationItemForm, type CommunicationItemDraft } from "@/components/admin/AdminCommunicationItemForm";
import { AdminCommunicationCsvActions } from "@/components/admin/AdminCommunicationCsvActions";
import type { CommunicationLesson } from "@/lib/supabase/communication-admin-types";

type Lesson = CommunicationLesson;
type LessonDraft = CommunicationLessonDraft;
type ItemDraft = CommunicationItemDraft;
const initialLesson: LessonDraft = { topic_id: "", lesson_key: "", title_en: "", title_vi: "", difficulty: "easy", sort_order: 1, status: "draft" };
const initialItem: ItemDraft = { lesson_id: "", item_key: "", item_type: "word", content_en: "", meaning_vi: "", example_en: "", example_vi: "", image_keyword: "", audio_url: "", sort_order: 1 };

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
  const { saveTopic, editTopic, removeTopic } = useAdminCommunicationTopicActions({
    supabase,
    topics,
    draft: topicDraft,
    editingId: topicEditing,
    setDraft: setTopicDraft,
    setEditingId: setTopicEditing,
    setBusy,
    refresh,
  });
  const { saveLesson, editLesson, removeLesson } = useAdminCommunicationLessonActions({
    supabase,
    topics,
    selectedTopicId,
    lessonCount: currentLessons.length,
    draft: lessonDraft,
    editingId: lessonEditing,
    setSelectedLessonId,
    setDraft: setLessonDraft,
    setEditingId: setLessonEditing,
    setBusy,
    refresh,
  });
  const currentItems = items.filter((item) => item.lesson_id === selectedLessonId);
  const { saveItem, editItem, removeItem } = useAdminCommunicationItemActions({
    supabase,
    lessons,
    selectedLessonId,
    itemCount: currentItems.length,
    draft: itemDraft,
    editingId: itemEditing,
    setDraft: setItemDraft,
    setEditingId: setItemEditing,
    setBusy,
    refresh,
  });
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
