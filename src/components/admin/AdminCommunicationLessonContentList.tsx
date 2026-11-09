import { Pencil, Trash2 } from "lucide-react";

import type { CommunicationLessonItem } from "@/lib/supabase/communication-admin-types";

type Props = {
  items: CommunicationLessonItem[];
  lessonTitle: string | null;
  selectedLessonId: string;
  busy: boolean;
  onDeleteAll: () => void;
  onEdit: (item: CommunicationLessonItem) => void;
  onRemove: (item: CommunicationLessonItem) => void;
};

export function AdminCommunicationLessonContentList({
  items,
  lessonTitle,
  selectedLessonId,
  busy,
  onDeleteAll,
  onEdit,
  onRemove,
}: Props) {
  return (
    <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div>
          <h2 className="font-bold text-slate-900">Lesson content <span className="text-slate-500">({items.length})</span></h2>
          <p className="mt-1 text-sm text-slate-500">{lessonTitle ?? "Select a lesson above."}</p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={onDeleteAll}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 disabled:opacity-50"
          >
            <Trash2 size={15} /> Delete all items
          </button>
        )}
      </div>

      {!selectedLessonId ? <p className="p-6 text-sm text-slate-500">Select a lesson to see its items.</p> : items.length === 0 ? (
        <p className="p-6 text-sm text-slate-500">No learning items yet.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <article key={item.id} className="flex flex-wrap items-center gap-2 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm text-slate-900">{item.content_en}</strong>
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-xs capitalize text-blue-700">{item.item_type.replace("_", " ")}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{item.meaning_vi}{item.example_en ? ` · ${item.example_en}` : ""}</p>
              </div>
              <button type="button" onClick={() => onEdit(item)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-blue-200 px-3 text-sm font-semibold text-blue-700">
                <Pencil size={15} /> Edit
              </button>
              <button type="button" onClick={() => onRemove(item)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700">
                <Trash2 size={15} /> Remove
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
