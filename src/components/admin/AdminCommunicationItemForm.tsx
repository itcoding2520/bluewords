import type { FormEvent } from "react";
import { Plus } from "lucide-react";

import { Select } from "@/components/ui/Select";
import type { CommunicationLessonItem } from "@/lib/supabase/communication-admin-types";

export type CommunicationItemDraft = Omit<CommunicationLessonItem, "id">;

const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-sky-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

type Props = {
  draft: CommunicationItemDraft;
  editing: boolean;
  busy: boolean;
  enabled: boolean;
  onDraftChange: (draft: CommunicationItemDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export function AdminCommunicationItemForm({
  draft,
  editing,
  busy,
  enabled,
  onDraftChange,
  onSubmit,
  onCancel,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-sky-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{editing ? "Edit learning item" : "Add a learning item"}</h2>
          <p className="mt-1 text-sm text-slate-500">Items connect words, useful phrases, and sentence patterns.</p>
        </div>
        {editing && <button type="button" className="text-sm font-semibold text-slate-500" onClick={onCancel}>Cancel</button>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold text-slate-600">
          Item key
          <input className={inputClass} value={draft.item_key} onChange={(event) => onDraftChange({ ...draft, item_key: event.target.value })} placeholder="reservation-phrase" disabled={editing} />
        </label>
        <label className="text-xs font-bold text-slate-600">
          Type
          <Select className="!mt-1 !h-11 !rounded-xl !border-sky-200 !text-sm" value={draft.item_type} onChange={(event) => onDraftChange({ ...draft, item_type: event.target.value as CommunicationLessonItem["item_type"] })}>
            <option value="word">Word</option>
            <option value="phrase">Useful phrase</option>
            <option value="sentence_pattern">Sentence pattern</option>
          </Select>
        </label>
        <label className="text-xs font-bold text-slate-600">
          English content
          <input className={inputClass} value={draft.content_en} onChange={(event) => onDraftChange({ ...draft, content_en: event.target.value })} placeholder="make a reservation" />
        </label>
        <label className="text-xs font-bold text-slate-600">
          Vietnamese meaning
          <input className={inputClass} value={draft.meaning_vi} onChange={(event) => onDraftChange({ ...draft, meaning_vi: event.target.value })} placeholder="đặt chỗ" />
        </label>
        <label className="text-xs font-bold text-slate-600">
          Example in English
          <input className={inputClass} value={draft.example_en} onChange={(event) => onDraftChange({ ...draft, example_en: event.target.value })} placeholder="I'd like to make a reservation." />
        </label>
        <label className="text-xs font-bold text-slate-600">
          Example in Vietnamese
          <input className={inputClass} value={draft.example_vi} onChange={(event) => onDraftChange({ ...draft, example_vi: event.target.value })} placeholder="Tôi muốn đặt bàn." />
        </label>
        <label className="text-xs font-bold text-slate-600">
          Image keyword
          <input className={inputClass} value={draft.image_keyword} onChange={(event) => onDraftChange({ ...draft, image_keyword: event.target.value })} placeholder="restaurant table" />
        </label>
        <label className="text-xs font-bold text-slate-600">
          Audio URL
          <input className={inputClass} type="url" value={draft.audio_url} onChange={(event) => onDraftChange({ ...draft, audio_url: event.target.value })} placeholder="https://…" />
        </label>
        <label className="text-xs font-bold text-slate-600">
          Order
          <input className={inputClass} type="number" min="0" value={draft.sort_order} onChange={(event) => onDraftChange({ ...draft, sort_order: Number(event.target.value) })} />
        </label>
        <button disabled={busy || !enabled} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white">
          <Plus size={17} />{editing ? "Save item" : "Add item"}
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-500">Dialogue scenarios and turns are included in the CSV import/export format.</p>
    </form>
  );
}
