import type { FormEvent } from "react";
import { Plus } from "lucide-react";
import { Select } from "@/components/ui/Select";
import type { SentenceDifficulty, SentenceQuestionInput } from "@/lib/sentence-builder";

const fields = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

export function AdminSentenceBuilderEditorForm({
  draft,
  editing,
  busy,
  categoryOptions,
  onDraftChange,
  onSave,
  onCancel,
}: {
  draft: SentenceQuestionInput;
  editing: string | null;
  busy: boolean;
  categoryOptions: string[];
  onDraftChange: (draft: SentenceQuestionInput) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form id="sentence-builder-editor" onSubmit={onSave} className="scroll-mt-4 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900">{editing ? `Edit ${draft.question_id}` : "Add a question"}</h2>
        {editing && <button type="button" className="text-sm font-semibold text-slate-500" onClick={onCancel}>Cancel edit</button>}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-bold text-slate-600">Question ID<input className={`${fields} mt-1`} value={draft.question_id} disabled={Boolean(editing)} placeholder="SB101" onChange={(event) => onDraftChange({ ...draft, question_id: event.target.value })}/><small className="mt-1 block font-normal text-slate-500">Example: SB001 (must be unique).</small></label>
        <label htmlFor="sentence-admin-difficulty" className="text-xs font-bold text-slate-600">Difficulty<Select id="sentence-admin-difficulty" containerClassName="mt-1" className="!h-[2.65rem] !rounded-xl !border-slate-200 !px-3 !text-sm" value={draft.difficulty} onChange={(event) => onDraftChange({ ...draft, difficulty: event.target.value as SentenceDifficulty })}><option value="easy">Easy / Dễ</option><option value="medium">Medium / Trung bình</option><option value="hard">Hard / Khó</option></Select><small className="mt-1 block font-normal text-slate-500">Example: Easy (CSV level 1).</small></label>
        <label htmlFor="sentence-admin-category" className="text-xs font-bold text-slate-600">Category<Select id="sentence-admin-category" containerClassName="mt-1" className="!h-[2.65rem] !rounded-xl !border-slate-200 !px-3 !text-sm" value={draft.category} onChange={(event) => onDraftChange({ ...draft, category: event.target.value })}><option value="" disabled>Select a category</option>{categoryOptions.map((name) => <option key={name} value={name}>{name}</option>)}</Select><small className="mt-1 block font-normal text-slate-500">Example: animals.</small></label>
        <label className="text-xs font-bold text-slate-600">Image keyword<input className={`${fields} mt-1`} value={draft.image_keyword} placeholder="cat" onChange={(event) => onDraftChange({ ...draft, image_keyword: event.target.value })}/><small className="mt-1 block font-normal text-slate-500">Example: cat (used to find a picture).</small></label>
        <label className="text-xs font-bold text-slate-600 md:col-span-2">Vietnamese clue<textarea className={`${fields} mt-1`} rows={2} value={draft.prompt_vi} onChange={(event) => onDraftChange({ ...draft, prompt_vi: event.target.value })}/><small className="mt-1 block font-normal text-slate-500">Example: Tôi nhìn thấy một con mèo.</small></label>
        <label className="text-xs font-bold text-slate-600 md:col-span-2">Correct sentence<input className={`${fields} mt-1`} value={draft.answer_sentence} onChange={(event) => onDraftChange({ ...draft, answer_sentence: event.target.value })}/><small className="mt-1 block font-normal text-slate-500">Example: I see a cat.</small></label>
        <label className="text-xs font-bold text-slate-600 md:col-span-2">Answer word tiles, in order (separate with |)<input className={`${fields} mt-1`} value={draft.answer_tokens.join(" | ")} onChange={(event) => onDraftChange({ ...draft, answer_tokens: event.target.value.split("|").map((item) => item.trim()).filter(Boolean) })}/><small className="mt-1 block font-normal text-slate-500">Example: I | see | a | cat. Keep the same order and punctuation as the correct sentence.</small></label>
        <label className="text-xs font-bold text-slate-600 md:col-span-2">Extra distractor tiles (separate with |)<input className={`${fields} mt-1`} value={draft.distractor_tokens.join(" | ")} onChange={(event) => onDraftChange({ ...draft, distractor_tokens: event.target.value.split("|").map((item) => item.trim()).filter(Boolean) })}/><small className="mt-1 block font-normal text-slate-500">Example: dog | big. These are extra tiles that do not belong in the answer.</small></label>
        <label className="text-xs font-bold text-slate-600 md:col-span-2">Vocabulary words (separate with |)<input className={`${fields} mt-1`} value={draft.vocabulary_words.join(" | ")} onChange={(event) => onDraftChange({ ...draft, vocabulary_words: event.target.value.split("|").map((item) => item.trim()).filter(Boolean) })}/><small className="mt-1 block font-normal text-slate-500">Example: I | see | cat. List the vocabulary words used in the sentence.</small></label>
      </div>
      <label className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={draft.is_active} onChange={(event) => onDraftChange({ ...draft, is_active: event.target.checked })}/> Available in the game</label>
      <small className="mt-1 block text-xs text-slate-500">Turn this off to keep the question in the admin bank without showing it to players.</small>
      <div><button disabled={busy} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white disabled:opacity-50"><Plus size={18}/>{busy ? "Saving…" : editing ? "Save changes" : "Add question"}</button></div>
    </form>
  );
}
