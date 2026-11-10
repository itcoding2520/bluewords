"use client";

import { useAdminCommunicationManagementController } from "@/hooks/useAdminCommunicationManagementController";
import { AdminCommunicationTopicList } from "@/components/admin/AdminCommunicationTopicList";
import { AdminCommunicationLessonList } from "@/components/admin/AdminCommunicationLessonList";
import { AdminCommunicationLessonContentList } from "@/components/admin/AdminCommunicationLessonContentList";
import { AdminCommunicationTopicForm } from "@/components/admin/AdminCommunicationTopicForm";
import { AdminCommunicationLessonForm } from "@/components/admin/AdminCommunicationLessonForm";
import { AdminCommunicationItemForm } from "@/components/admin/AdminCommunicationItemForm";
import { AdminCommunicationCsvActions } from "@/components/admin/AdminCommunicationCsvActions";

export function AdminCommunicationManagement() {
  const {
    supabase,
    topics,
    lessons,
    items,
    selectedTopicId,
    selectedLessonId,
    loading,
    refresh,
    busy,
    setBusy,
    topicDraft,
    topicEditing,
    lessonDraft,
    lessonEditing,
    itemDraft,
    itemEditing,
    topicSearch,
    currentTopic,
    currentLessons,
    currentItems,
    filteredTopics,
    topicWordCounts,
    selectedLessonTitle,
    setTopicDraft,
    setLessonDraft,
    setItemDraft,
    setTopicSearch,
    selectTopic,
    selectLesson,
    editTopic,
    editLesson,
    editItem,
    removeLesson,
    removeItem,
    removeAllLessons,
    removeAllItems,
    cancelTopicEdit,
    cancelLessonEdit,
    cancelItemEdit,
    submitTopic,
    submitLesson,
    submitItem,
    removeTopicFromList,
  } = useAdminCommunicationManagementController();

  return <main className="space-y-5">
    <header className="rounded-3xl border border-sky-100 bg-gradient-to-r from-white via-sky-50 to-cyan-100 p-5 sm:p-7">
      <p className="text-sm font-bold text-blue-600">Administration</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title text-3xl">Situational English</h1>
          <p className="page-intro-description mt-2">Build lessons that connect vocabulary, useful phrases, sentence patterns, and conversations.</p>
        </div>
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
          onSubmit={submitTopic}
          onCancel={cancelTopicEdit}
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
          onRemove={removeTopicFromList}
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
          onSubmit={submitLesson}
          onCancel={cancelLessonEdit}
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
          onSubmit={submitItem}
          onCancel={cancelItemEdit}
        />
        <AdminCommunicationLessonContentList
          items={currentItems}
          lessonTitle={selectedLessonTitle}
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
