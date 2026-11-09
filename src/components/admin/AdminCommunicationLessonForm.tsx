import type { FormEvent } from "react";
import { Plus } from "lucide-react";

import { Select } from "@/components/ui/Select";
import type { CommunicationDifficulty, ContentStatus } from "@/lib/supabase/situational-english";
import type { CommunicationLesson } from "@/lib/supabase/communication-admin-types";

export type CommunicationLessonDraft = Omit<CommunicationLesson, "id">;

const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-sky-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

type Props = {
  draft: CommunicationLessonDraft;
  editing: boolean;
  busy: boolean;
  enabled: boolean;
  topicTitle: string | null;
  onDraftChange: (draft: CommunicationLessonDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export function AdminCommunicationLessonForm({
  draft,
  editing,
  busy,
  enabled,
  topicTitle,
  onDraftChange,
  onSubmit,
  onCancel,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-sky-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{editing ? "Edit lesson" : "Add a lesson"}</h2>
          <p className="mt-1 text-sm text-slate-500">{topicTitle ?? "Select a situation first."}</p>
        </div>
        {editing && <button type="button" className="text-sm font-semibold text-slate-500" onClick={onCancel}>Cancel</button>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold text-slate-600">
          Lesson key
          <input className={inputClass} value={draft.lesson_key} onChange={(event) => onDraftChange({ ...draft, lesson_key: event.target.value })} placeholder="restaurant-booking-easy" disabled={editing} />
        </label>
        <label className="text-xs font-bold text-slate-600">
          Difficulty
          <Select className="!mt-1 !h-11 !rounded-xl !border-sky-200 !text-sm" value={draft.difficulty} onChange={(event) => onDraftChange({ ...draft, difficulty: event.target.value as CommunicationDifficulty })}>
            <option value="easy">Easy · Dễ</option>
            <option value="medium">Medium · Trung bình</option>
            <option value="hard">Hard · Khó</option>
          </Select>
        </label>
        <label className="text-xs font-bold text-slate-600">
          English title
          <input className={inputClass} value={draft.title_en} onChange={(event) => onDraftChange({ ...draft, title_en: event.target.value })} placeholder="Booking a table" />
        </label>
        <label className="text-xs font-bold text-slate-600">
          Vietnamese title
          <input className={inputClass} value={draft.title_vi} onChange={(event) => onDraftChange({ ...draft, title_vi: event.target.value })} placeholder="Đặt bàn" />
        </label>
        <label className="text-xs font-bold text-slate-600">
          Order
          <input className={inputClass} type="number" min="0" value={draft.sort_order} onChange={(event) => onDraftChange({ ...draft, sort_order: Number(event.target.value) })} />
        </label>
        <label className="text-xs font-bold text-slate-600">
          Status
          <Select className="!mt-1 !h-11 !rounded-xl !border-sky-200 !text-sm" value={draft.status} onChange={(event) => onDraftChange({ ...draft, status: event.target.value as ContentStatus })}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </label>
        <button disabled={busy || !enabled} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white sm:col-span-2">
          <Plus size={17} />{editing ? "Save lesson" : "Add lesson"}
        </button>
      </div>
    </form>
  );
}
