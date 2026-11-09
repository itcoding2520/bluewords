import type { FormEvent } from "react";
import { Plus } from "lucide-react";

import { Select } from "@/components/ui/Select";
import type { ContentStatus } from "@/lib/supabase/situational-english";
import type { CommunicationTopic } from "@/lib/supabase/communication-admin-types";

export type CommunicationTopicDraft = Pick<
  CommunicationTopic,
  "slug" | "title_en" | "title_vi" | "description_en" | "description_vi" | "sort_order" | "status"
>;

const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-sky-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

type Props = {
  draft: CommunicationTopicDraft;
  editing: boolean;
  busy: boolean;
  onDraftChange: (draft: CommunicationTopicDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export function AdminCommunicationTopicForm({
  draft,
  editing,
  busy,
  onDraftChange,
  onSubmit,
  onCancel,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-sky-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">{editing ? "Edit situation" : "Add a situation"}</h2>
        {editing && <button type="button" className="text-sm font-semibold text-slate-500" onClick={onCancel}>Cancel</button>}
      </div>
      <div className="grid gap-3">
        <label className="text-xs font-bold text-slate-600">
          Slug
          <input className={inputClass} value={draft.slug} onChange={(event) => onDraftChange({ ...draft, slug: event.target.value })} placeholder="food-restaurants" disabled={editing} />
        </label>
        <label className="text-xs font-bold text-slate-600">
          English title
          <input className={inputClass} value={draft.title_en} onChange={(event) => onDraftChange({ ...draft, title_en: event.target.value })} placeholder="Food and restaurants" />
        </label>
        <label className="text-xs font-bold text-slate-600">
          Vietnamese title
          <input className={inputClass} value={draft.title_vi} onChange={(event) => onDraftChange({ ...draft, title_vi: event.target.value })} placeholder="Đồ ăn và nhà hàng" />
        </label>
        <label className="text-xs font-bold text-slate-600">
          English description
          <input className={inputClass} value={draft.description_en} onChange={(event) => onDraftChange({ ...draft, description_en: event.target.value })} />
        </label>
        <label className="text-xs font-bold text-slate-600">
          Vietnamese description
          <input className={inputClass} value={draft.description_vi} onChange={(event) => onDraftChange({ ...draft, description_vi: event.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-3">
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
        </div>
        <button disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white">
          <Plus size={17} />{editing ? "Save situation" : "Add situation"}
        </button>
      </div>
    </form>
  );
}
