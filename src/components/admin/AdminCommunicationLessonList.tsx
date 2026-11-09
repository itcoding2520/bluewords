import { Pencil, Trash2 } from "lucide-react";

import { Select } from "@/components/ui/Select";
import type {
  CommunicationLesson,
  CommunicationLessonItem,
  CommunicationTopic,
} from "@/lib/supabase/communication-admin-types";

type Props = {
  topics: CommunicationTopic[];
  lessons: CommunicationLesson[];
  items: CommunicationLessonItem[];
  selectedTopicId: string;
  selectedLessonId: string;
  busy: boolean;
  onSelectTopic: (topicId: string) => void;
  onSelectLesson: (lesson: CommunicationLesson) => void;
  onEdit: (lesson: CommunicationLesson) => void;
  onRemove: (lesson: CommunicationLesson) => void;
  onDeleteAll: () => void;
};

export function AdminCommunicationLessonList({
  topics,
  lessons,
  items,
  selectedTopicId,
  selectedLessonId,
  busy,
  onSelectTopic,
  onSelectLesson,
  onEdit,
  onRemove,
  onDeleteAll,
}: Props) {
  return (
    <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div>
          <h2 className="font-bold text-slate-900">Lessons <span className="text-slate-500">({lessons.length})</span></h2>
          <p className="mt-1 text-sm text-slate-500">Select a lesson to manage its words, phrases, and sentence patterns.</p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Select
            aria-label="Select situation"
            containerClassName="min-w-0 flex-1 sm:w-64 sm:flex-none"
            className="!h-11 !rounded-xl !border-sky-200 !text-sm"
            value={selectedTopicId}
            onChange={(event) => onSelectTopic(event.target.value)}
          >
            <option value="">Select situation</option>
            {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.title_en}</option>)}
          </Select>
          {lessons.length > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={onDeleteAll}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 disabled:opacity-50"
            >
              <Trash2 size={15} /> Delete all lessons
            </button>
          )}
        </div>
      </div>

      {!selectedTopicId ? <p className="p-6 text-sm text-slate-500">Add or select a situation.</p> : lessons.length === 0 ? (
        <p className="p-6 text-sm text-slate-500">No lessons yet for this situation.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {lessons.map((lesson) => (
            <article key={lesson.id} className={`flex flex-wrap items-center gap-2 p-3 ${selectedLessonId === lesson.id ? "bg-blue-50/70" : ""}`}>
              <button type="button" onClick={() => onSelectLesson(lesson)} className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-bold text-slate-900">
                  {lesson.title_en} <span className="font-medium capitalize text-blue-700">· {lesson.difficulty}</span>
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {lesson.title_vi} · {lesson.status} · {items.filter((item) => item.lesson_id === lesson.id).length} items
                </span>
              </button>
              <button type="button" aria-label={`Edit ${lesson.title_en}`} onClick={() => onEdit(lesson)} className="grid size-9 place-items-center rounded-lg border border-blue-100 text-blue-700">
                <Pencil size={15} />
              </button>
              <button type="button" aria-label={`Remove ${lesson.title_en}`} onClick={() => onRemove(lesson)} className="grid size-9 place-items-center rounded-lg border border-rose-100 text-rose-600">
                <Trash2 size={15} />
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
