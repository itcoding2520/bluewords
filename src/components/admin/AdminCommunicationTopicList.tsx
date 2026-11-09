import { Pencil, Trash2 } from "lucide-react";

import type { TopicWordCounts } from "@/lib/communication/topic-word-counts";
import type { CommunicationLesson, CommunicationTopic } from "@/lib/supabase/communication-admin-types";

const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-sky-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

type Props = {
  topics: CommunicationTopic[];
  totalCount: number;
  lessons: CommunicationLesson[];
  wordCounts: Map<string, TopicWordCounts>;
  selectedTopicId: string;
  search: string;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onSelect: (topicId: string) => void;
  onEdit: (topic: CommunicationTopic) => void;
  onRemove: (topic: CommunicationTopic) => void;
};

export function AdminCommunicationTopicList({
  topics,
  totalCount,
  lessons,
  wordCounts,
  selectedTopicId,
  search,
  loading,
  onSearchChange,
  onSelect,
  onEdit,
  onRemove,
}: Props) {
  return (
    <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <h2 className="font-bold text-slate-900">Situations <span className="text-slate-500">({totalCount})</span></h2>
        <input aria-label="Search situations" className={inputClass} value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search situations…" />
      </div>
      {loading ? <p className="p-6 text-sm text-slate-500">Loading…</p> : (
        <div className="max-h-[34rem] divide-y divide-slate-100 overflow-y-auto">
          {topics.map((topic) => {
            const lessonCount = lessons.filter((lesson) => lesson.topic_id === topic.id).length;
            const counts = wordCounts.get(topic.id) ?? { easy: 0, medium: 0, hard: 0 };
            return (
              <article key={topic.id} className={`flex items-center gap-2 p-3 ${selectedTopicId === topic.id ? "bg-blue-50" : ""}`}>
                <button type="button" onClick={() => onSelect(topic.id)} className="min-w-0 flex-1 text-left">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-900">
                    <span className="truncate">{topic.title_en}</span>
                    <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-blue-700">{lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}</span>
                  </span>
                  <span className="block truncate text-xs text-slate-500">{topic.title_vi} · {topic.status}</span>
                  <span className="mt-0.5 block text-[11px] font-semibold text-blue-700">Words · Easy {counts.easy} / Medium {counts.medium} / Hard {counts.hard}</span>
                </button>
                <button type="button" aria-label={`Edit ${topic.title_en}`} onClick={() => onEdit(topic)} className="grid size-9 shrink-0 place-items-center rounded-lg border border-blue-100 text-blue-700"><Pencil size={15} /></button>
                <button type="button" aria-label={`Remove ${topic.title_en}`} onClick={() => onRemove(topic)} className="grid size-9 shrink-0 place-items-center rounded-lg border border-rose-100 text-rose-600"><Trash2 size={15} /></button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
