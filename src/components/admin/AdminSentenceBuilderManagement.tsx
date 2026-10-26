"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Download, FileUp, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Select } from "@/components/ui/Select";
import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";
import { exportSentenceBuilderCsv, loadSentenceBuilderQuestions, parseSentenceBuilderCsv, type SentenceBuilderQuestion, type SentenceDifficulty, type SentenceQuestionInput } from "@/lib/supabase/sentence-builder";

const empty: SentenceQuestionInput = { question_id: "", difficulty: "easy", category: "", prompt_vi: "", answer_sentence: "", answer_tokens: [], distractor_tokens: [], image_keyword: "", vocabulary_words: [], is_active: true };
const fields = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

export function AdminSentenceBuilderManagement() {
  const [questions, setQuestions] = useState<SentenceBuilderQuestion[]>([]);
  const [draft, setDraft] = useState<SentenceQuestionInput>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<SentenceDifficulty | "all">("all");
  const [pageSize, setPageSize] = useState<50 | 100>(50);
  const [page, setPage] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirmDialog();
  const filteredQuestions = useMemo(() => filter === "all" ? questions : questions.filter((question) => question.difficulty === filter), [filter, questions]);
  const pageCount = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filteredQuestions.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const categoryOptions = [...new Set([...questions.map((question) => question.category), draft.category].map((name) => name.trim()).filter(Boolean))].sort((left, right) => left.localeCompare(right));

  async function refresh() {
    setLoading(true);
    try { setQuestions(await loadSentenceBuilderQuestions(false)); }
    catch { toast.error("Could not load Sentence Builder questions."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    void loadSentenceBuilderQuestions(false).then((data) => { if (active) setQuestions(data); })
      .catch(() => { if (active) toast.error("Could not load Sentence Builder questions."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function editQuestion(question: SentenceBuilderQuestion) {
    setEditing(question.id);
    setDraft({ ...question, answer_tokens: [...question.answer_tokens], distractor_tokens: [...question.distractor_tokens], vocabulary_words: [...question.vocabulary_words] });
    document.getElementById("sentence-builder-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const input: SentenceQuestionInput = { ...draft, question_id: draft.question_id.trim(), category: draft.category.trim(), prompt_vi: draft.prompt_vi.trim(), answer_sentence: draft.answer_sentence.trim(), image_keyword: draft.image_keyword.trim() };
    if (!input.question_id || !input.category || !input.prompt_vi || !input.answer_sentence || input.answer_tokens.length < 2) { toast.error("Complete the required fields and add at least two answer tokens."); return; }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = editing
        ? await supabase.from("sentence_builder_questions").update({ ...input, updated_at: new Date().toISOString() }).eq("id", editing)
        : await supabase.from("sentence_builder_questions").insert(input);
      if (error) throw error;
      toast.success(editing ? "Question updated." : "Question added.");
      setDraft(empty); setEditing(null); await refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save this question."); }
    finally { setBusy(false); }
  }

  async function removeQuestion(question: SentenceBuilderQuestion) {
    const confirmed = await confirm({ title: "Remove sentence question?", description: `Remove ${question.question_id} (“${question.answer_sentence}”)?`, confirmLabel: "Remove" });
    if (!confirmed) return;
    const { error } = await createClient().from("sentence_builder_questions").delete().eq("id", question.id);
    if (error) toast.error("Could not remove this question."); else { toast.success("Question removed."); await refresh(); }
  }

  async function importCsv(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const rows = parseSentenceBuilderCsv(await file.text());
      const { error } = await createClient().from("sentence_builder_questions").upsert(rows, { onConflict: "question_id" });
      if (error) throw error;
      toast.success(`Imported ${rows.length} questions.`);
      await refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "CSV import failed."); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function exportCsv() {
    try {
      const rows = await loadSentenceBuilderQuestions(false);
      const blob = new Blob(["\uFEFF", exportSentenceBuilderCsv(rows)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob); const link = document.createElement("a");
      link.href = url; link.download = "BlueWords_Sentence_Builder_Questions.csv"; link.click(); URL.revokeObjectURL(url);
    } catch { toast.error("Could not export questions."); }
  }

  return <main className="space-y-5">
    <header className="rounded-3xl border border-sky-100 bg-gradient-to-r from-white via-sky-50 to-cyan-100 p-5 sm:p-7">
      <p className="text-sm font-bold text-blue-600">Administration</p><div className="mt-1 flex flex-wrap items-end justify-between gap-4"><div><h1 className="page-title text-3xl">Sentence Builder data</h1><p className="page-intro-description mt-2">Manage sentence prompts and choose a difficulty for every question.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void refresh()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 text-sm font-semibold text-blue-700"><RefreshCw size={16}/> Refresh</button><button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 text-sm font-semibold text-blue-700"><FileUp size={16}/> Import CSV</button><input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void importCsv(event.target.files?.[0])}/><button type="button" onClick={() => void exportCsv()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white"><Download size={16}/> Export CSV</button></div></div>
    </header>

    <form id="sentence-builder-editor" onSubmit={(event) => void save(event)} className="scroll-mt-4 rounded-3xl border border-sky-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2"><h2 className="text-lg font-bold text-slate-900">{editing ? `Edit ${draft.question_id}` : "Add a question"}</h2>{editing && <button type="button" className="text-sm font-semibold text-slate-500" onClick={() => { setEditing(null); setDraft(empty); }}>Cancel edit</button>}</div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-bold text-slate-600">Question ID<input className={`${fields} mt-1`} value={draft.question_id} disabled={Boolean(editing)} placeholder="SB101" onChange={(e) => setDraft({ ...draft, question_id: e.target.value })}/><small className="mt-1 block font-normal text-slate-500">Example: SB001 (must be unique).</small></label>
        <label htmlFor="sentence-admin-difficulty" className="text-xs font-bold text-slate-600">Difficulty<Select id="sentence-admin-difficulty" containerClassName="mt-1" className="!h-[2.65rem] !rounded-xl !border-slate-200 !px-3 !text-sm" value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as SentenceDifficulty })}><option value="easy">Easy / Dễ</option><option value="medium">Medium / Trung bình</option><option value="hard">Hard / Khó</option></Select><small className="mt-1 block font-normal text-slate-500">Example: Easy (CSV level 1).</small></label>
        <label htmlFor="sentence-admin-category" className="text-xs font-bold text-slate-600">Category<Select id="sentence-admin-category" containerClassName="mt-1" className="!h-[2.65rem] !rounded-xl !border-slate-200 !px-3 !text-sm" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}><option value="" disabled>Select a category</option>{categoryOptions.map((name) => <option key={name} value={name}>{name}</option>)}</Select><small className="mt-1 block font-normal text-slate-500">Example: animals.</small></label>
        <label className="text-xs font-bold text-slate-600">Image keyword<input className={`${fields} mt-1`} value={draft.image_keyword} placeholder="cat" onChange={(e) => setDraft({ ...draft, image_keyword: e.target.value })}/><small className="mt-1 block font-normal text-slate-500">Example: cat (used to find a picture).</small></label>
        <label className="text-xs font-bold text-slate-600 md:col-span-2">Vietnamese clue<textarea className={`${fields} mt-1`} rows={2} value={draft.prompt_vi} onChange={(e) => setDraft({ ...draft, prompt_vi: e.target.value })}/><small className="mt-1 block font-normal text-slate-500">Example: Tôi nhìn thấy một con mèo.</small></label>
        <label className="text-xs font-bold text-slate-600 md:col-span-2">Correct sentence<input className={`${fields} mt-1`} value={draft.answer_sentence} onChange={(e) => setDraft({ ...draft, answer_sentence: e.target.value })}/><small className="mt-1 block font-normal text-slate-500">Example: I see a cat.</small></label>
        <label className="text-xs font-bold text-slate-600 md:col-span-2">Answer word tiles, in order (separate with |)<input className={`${fields} mt-1`} value={draft.answer_tokens.join(" | ")} onChange={(e) => setDraft({ ...draft, answer_tokens: e.target.value.split("|").map((item) => item.trim()).filter(Boolean) })}/><small className="mt-1 block font-normal text-slate-500">Example: I | see | a | cat. Keep the same order and punctuation as the correct sentence.</small></label>
        <label className="text-xs font-bold text-slate-600 md:col-span-2">Extra distractor tiles (separate with |)<input className={`${fields} mt-1`} value={draft.distractor_tokens.join(" | ")} onChange={(e) => setDraft({ ...draft, distractor_tokens: e.target.value.split("|").map((item) => item.trim()).filter(Boolean) })}/><small className="mt-1 block font-normal text-slate-500">Example: dog | big. These are extra tiles that do not belong in the answer.</small></label>
        <label className="text-xs font-bold text-slate-600 md:col-span-2">Vocabulary words (separate with |)<input className={`${fields} mt-1`} value={draft.vocabulary_words.join(" | ")} onChange={(e) => setDraft({ ...draft, vocabulary_words: e.target.value.split("|").map((item) => item.trim()).filter(Boolean) })}/><small className="mt-1 block font-normal text-slate-500">Example: I | see | cat. List the vocabulary words used in the sentence.</small></label>
      </div>
      <label className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}/> Available in the game</label><small className="mt-1 block text-xs text-slate-500">Turn this off to keep the question in the admin bank without showing it to players.</small>
      <div><button disabled={busy} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white disabled:opacity-50"><Plus size={18}/>{busy ? "Saving…" : editing ? "Save changes" : "Add question"}</button></div>
    </form>

    <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5"><div><h2 className="text-lg font-bold text-slate-900">Question bank <span className="text-sm text-slate-500">({filteredQuestions.length})</span></h2><p className="mt-1 text-sm text-slate-500">Source level 1/2/3 maps to Easy/Medium/Hard when importing the sample CSV.</p></div><div className="flex w-full flex-wrap gap-2 sm:w-auto"><Select aria-label="Filter by difficulty" containerClassName="w-full sm:w-40" className="!h-[2.65rem] !rounded-xl !border-slate-200 !px-3 !text-sm" value={filter} onChange={(e) => { setFilter(e.target.value as SentenceDifficulty | "all"); setPage(1); }}><option value="all">All levels</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></Select><Select aria-label="Questions per page" containerClassName="w-full sm:w-32" className="!h-[2.65rem] !rounded-xl !border-slate-200 !px-3 !text-sm" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value) as 50 | 100); setPage(1); }}><option value={50}>50 / page</option><option value={100}>100 / page</option></Select></div></div>
      {loading ? <p className="p-8 text-center text-sm text-slate-500">Loading questions…</p> : visible.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No questions found.</p> : <div className="divide-y divide-slate-100">{visible.map((question) => <article key={question.id} className="flex flex-wrap items-center gap-3 p-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-slate-900">{question.question_id} · {question.answer_sentence}</strong><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold capitalize text-blue-700">{question.difficulty}</span>{!question.is_active && <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">Inactive</span>}</div><p className="mt-1 truncate text-sm text-slate-500">{question.prompt_vi} · {question.category}</p></div><button type="button" onClick={() => editQuestion(question)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-blue-200 px-3 text-sm font-semibold text-blue-700"><Pencil size={15}/> Edit</button><button type="button" onClick={() => void removeQuestion(question)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700"><Trash2 size={15}/> Remove</button></article>)}</div>}
      {!loading && filteredQuestions.length > 0 && <footer className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-slate-500"><span>Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredQuestions.length)} of {filteredQuestions.length} questions</span><div className="flex items-center gap-3"><span>Page {currentPage} of {pageCount}</span><button type="button" aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">‹</button><button type="button" aria-label="Next page" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)} className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">›</button></div></footer>}
    </section>
  </main>;
}
