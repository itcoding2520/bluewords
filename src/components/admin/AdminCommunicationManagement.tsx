"use client";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { Download, FileUp, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Select } from "@/components/ui/Select";
import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";
import { exportCommunicationCsv, type CommunicationDifficulty, type ContentStatus } from "@/lib/supabase/situational-english";
import { importCommunicationCsv } from "@/lib/supabase/import-communication-csv";
import { loadCommunicationSituationExport } from "@/lib/supabase/export-communication-situation";
import { getCommunicationTopicWordCounts } from "@/lib/communication/topic-word-counts";
import { useAdminCommunicationCollections } from "@/hooks/useAdminCommunicationCollections";
import type { CommunicationLesson, CommunicationLessonItem, CommunicationTopic } from "@/lib/supabase/communication-admin-types";

type Topic = CommunicationTopic;
type Lesson = CommunicationLesson;
type Item = CommunicationLessonItem;
type LessonDraft = Omit<Lesson, "id">;
type ItemDraft = Omit<Item, "id">;
const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-sky-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
const initialLesson: LessonDraft = { topic_id: "", lesson_key: "", title_en: "", title_vi: "", difficulty: "easy", sort_order: 1, status: "draft" };
const initialItem: ItemDraft = { lesson_id: "", item_key: "", item_type: "word", content_en: "", meaning_vi: "", example_en: "", example_vi: "", image_keyword: "", audio_url: "", sort_order: 1 };
function isOptionalHttpUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch { return false; }
}

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
  const [topicDraft, setTopicDraft] = useState({ slug: "", title_en: "", title_vi: "", description_en: "", description_vi: "", sort_order: 1, status: "draft" as ContentStatus });
  const [topicEditing, setTopicEditing] = useState<string | null>(null);
  const [lessonDraft, setLessonDraft] = useState<LessonDraft>(initialLesson);
  const [lessonEditing, setLessonEditing] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState<ItemDraft>(initialItem);
  const [itemEditing, setItemEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [topicSearch, setTopicSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirmDialog();
  const currentTopic = topics.find((topic) => topic.id === selectedTopicId) ?? null;
  const currentLessons = lessons.filter((lesson) => lesson.topic_id === selectedTopicId);
  const currentItems = items.filter((item) => item.lesson_id === selectedLessonId);
  const filteredTopics = topics.filter((topic) => `${topic.title_en} ${topic.title_vi} ${topic.slug}`.toLowerCase().includes(topicSearch.toLowerCase()));
  const topicWordCounts = useMemo(() => getCommunicationTopicWordCounts(lessons, items), [items, lessons]);

  async function saveTopic(event: FormEvent) {
    event.preventDefault();
    const payload = { ...topicDraft, slug: topicDraft.slug.trim().toLowerCase().replaceAll(" ", "-"), title_en: topicDraft.title_en.trim(), title_vi: topicDraft.title_vi.trim() };
    if (!payload.slug || !payload.title_en || !payload.title_vi) return toast.error("Add a stable slug and both topic titles.");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) return toast.error("Use lowercase letters, numbers, and single hyphens in the situation slug.");
    setBusy(true);
    const query = topicEditing ? supabase.from("communication_topics").update(payload).eq("id", topicEditing) : supabase.from("communication_topics").insert(payload);
    const { error } = await query;
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(topicEditing ? "Topic updated." : "Topic added."); setTopicDraft({ slug: "", title_en: "", title_vi: "", description_en: "", description_vi: "", sort_order: topics.length + 1, status: "draft" }); setTopicEditing(null); await refresh();
  }
  function editTopic(topic: Topic) { setTopicEditing(topic.id); setTopicDraft({ slug: topic.slug, title_en: topic.title_en, title_vi: topic.title_vi, description_en: topic.description_en, description_vi: topic.description_vi, sort_order: topic.sort_order, status: topic.status }); }
  async function removeTopic(topic: Topic) {
    if (!await confirm({ title: "Remove situation?", description: `Remove “${topic.title_en}” and all its lessons and content?`, confirmLabel: "Remove" })) return;
    const { error } = await supabase.from("communication_topics").delete().eq("id", topic.id);
    if (error) toast.error(error.message); else { toast.success("Situation removed."); await refresh(); }
  }

  async function saveLesson(event: FormEvent) {
    event.preventDefault();
    const payload = { ...lessonDraft, topic_id: selectedTopicId, lesson_key: lessonDraft.lesson_key.trim(), title_en: lessonDraft.title_en.trim(), title_vi: lessonDraft.title_vi.trim() };
    if (!topics.some((topic) => topic.id === payload.topic_id) || !payload.lesson_key || !payload.title_en || !payload.title_vi) return toast.error("Select an existing situation and complete the lesson key and titles.");
    if (payload.lesson_key.length < 2 || payload.lesson_key.length > 80) return toast.error("The lesson key must be between 2 and 80 characters.");
    setBusy(true);
    const query = lessonEditing ? supabase.from("communication_lessons").update(payload).eq("id", lessonEditing) : supabase.from("communication_lessons").insert(payload);
    const { error } = await query;
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(lessonEditing ? "Lesson updated." : "Lesson added."); setLessonDraft({ ...initialLesson, topic_id: selectedTopicId, sort_order: currentLessons.length + 1 }); setLessonEditing(null); await refresh();
  }
  function editLesson(lesson: Lesson) { setSelectedLessonId(lesson.id); setLessonEditing(lesson.id); setLessonDraft({ topic_id: lesson.topic_id, lesson_key: lesson.lesson_key, title_en: lesson.title_en, title_vi: lesson.title_vi, difficulty: lesson.difficulty, sort_order: lesson.sort_order, status: lesson.status }); }
  async function removeLesson(lesson: Lesson) {
    if (!await confirm({ title: "Remove lesson?", description: `Remove “${lesson.title_en}” and its items and dialogues?`, confirmLabel: "Remove" })) return;
    const { error } = await supabase.from("communication_lessons").delete().eq("id", lesson.id);
    if (error) toast.error(error.message); else { toast.success("Lesson removed."); await refresh(); }
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

  async function saveItem(event: FormEvent) {
    event.preventDefault();
    const payload = { ...itemDraft, lesson_id: selectedLessonId, item_key: itemDraft.item_key.trim(), content_en: itemDraft.content_en.trim(), meaning_vi: itemDraft.meaning_vi.trim() };
    if (!lessons.some((lesson) => lesson.id === payload.lesson_id) || !payload.item_key || !payload.content_en || !payload.meaning_vi) return toast.error("Select an existing lesson and complete the item key, English content, and Vietnamese meaning.");
    if (payload.item_key.length < 2 || payload.item_key.length > 100) return toast.error("The item key must be between 2 and 100 characters.");
    if (Boolean(payload.example_en.trim()) !== Boolean(payload.example_vi.trim())) return toast.error("Provide both example translations, or leave both examples blank.");
    if (payload.item_type === "sentence_pattern" && (!payload.example_en.trim() || !payload.example_vi.trim())) return toast.error("Sentence patterns need an English example and its Vietnamese translation.");
    if (!isOptionalHttpUrl(payload.audio_url)) return toast.error("Audio URL must be a valid HTTP or HTTPS link.");
    setBusy(true);
    const query = itemEditing ? supabase.from("communication_lesson_items").update(payload).eq("id", itemEditing) : supabase.from("communication_lesson_items").insert(payload);
    const { error } = await query;
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(itemEditing ? "Learning item updated." : "Learning item added."); setItemDraft({ ...initialItem, lesson_id: selectedLessonId, sort_order: currentItems.length + 1 }); setItemEditing(null); await refresh();
  }
  function editItem(item: Item) { setItemEditing(item.id); setItemDraft({ lesson_id: item.lesson_id, item_key: item.item_key, item_type: item.item_type, content_en: item.content_en, meaning_vi: item.meaning_vi, example_en: item.example_en, example_vi: item.example_vi, image_keyword: item.image_keyword, audio_url: item.audio_url, sort_order: item.sort_order }); }
  async function removeItem(item: Item) {
    if (!await confirm({ title: "Remove learning item?", description: `Remove “${item.content_en}” from this lesson?`, confirmLabel: "Remove" })) return;
    const { error } = await supabase.from("communication_lesson_items").delete().eq("id", item.id);
    if (error) toast.error(error.message); else { toast.success("Learning item removed."); await refresh(); }
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

  async function importCsv(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const result = await importCommunicationCsv(supabase, await file.text());
      if (!result.hasContentRows) {
        toast.info(result.duplicateRowsInFile.length ? `No new rows to import. Skipped ${result.duplicateRowsInFile.length} duplicate CSV rows.` : "The CSV has no content rows.");
        return;
      }
      const imported = result.importedItems + result.importedTurns;
      if (result.skippedRows) {
        const rowDetails = result.skippedRowNumbers.length ? ` Skipped CSV rows: ${[...new Set(result.skippedRowNumbers)].join(", ")}.` : "";
        toast.success(`Imported ${imported} new rows (${result.importedItems} items, ${result.importedTurns} dialogue turns). Skipped ${result.skippedRows} duplicate rows.${rowDetails}`);
      } else {
        toast.success(`Imported ${imported} rows (${result.importedItems} items, ${result.importedTurns} dialogue turns).`);
      }
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "CSV import failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function exportCsv() {
    if (!selectedTopicId) {
      toast.error("Select a situation before exporting its CSV.");
      return;
    }
    setBusy(true);
    try {
      const { topicSlug, records } = await loadCommunicationSituationExport(supabase, selectedTopicId);
      const blob = new Blob(["\uFEFF", exportCommunicationCsv(records)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `BlueWords_Situational_English_${topicSlug}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${records.length} content rows.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not export communication content.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="space-y-5">
    <header className="rounded-3xl border border-sky-100 bg-gradient-to-r from-white via-sky-50 to-cyan-100 p-5 sm:p-7">
      <p className="text-sm font-bold text-blue-600">Administration</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4"><div><h1 className="page-title text-3xl">Situational English</h1><p className="page-intro-description mt-2">Build lessons that connect vocabulary, useful phrases, sentence patterns, and conversations.</p></div>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void refresh()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 text-sm font-semibold text-blue-700"><RefreshCw size={16}/> Refresh</button><button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 text-sm font-semibold text-blue-700"><FileUp size={16}/> Import CSV</button><input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void importCsv(event.target.files?.[0])}/><button type="button" title="Export the selected situation only" aria-label="Export selected situation CSV" disabled={busy || !selectedTopicId} onClick={() => void exportCsv()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"><Download size={16}/> Export situation</button></div>
      </div>
    </header>

    <section className="grid gap-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.6fr)]">
      <div className="space-y-5">
        <form onSubmit={(event) => void saveTopic(event)} className="rounded-3xl border border-sky-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">{topicEditing ? "Edit situation" : "Add a situation"}</h2>{topicEditing && <button type="button" className="text-sm font-semibold text-slate-500" onClick={() => { setTopicEditing(null); setTopicDraft({ slug: "", title_en: "", title_vi: "", description_en: "", description_vi: "", sort_order: topics.length + 1, status: "draft" }); }}>Cancel</button>}</div>
          <div className="grid gap-3"><label className="text-xs font-bold text-slate-600">Slug<input className={inputClass} value={topicDraft.slug} onChange={(e) => setTopicDraft({ ...topicDraft, slug: e.target.value })} placeholder="food-restaurants" disabled={Boolean(topicEditing)}/></label><label className="text-xs font-bold text-slate-600">English title<input className={inputClass} value={topicDraft.title_en} onChange={(e) => setTopicDraft({ ...topicDraft, title_en: e.target.value })} placeholder="Food and restaurants"/></label><label className="text-xs font-bold text-slate-600">Vietnamese title<input className={inputClass} value={topicDraft.title_vi} onChange={(e) => setTopicDraft({ ...topicDraft, title_vi: e.target.value })} placeholder="Đồ ăn và nhà hàng"/></label><label className="text-xs font-bold text-slate-600">English description<input className={inputClass} value={topicDraft.description_en} onChange={(e) => setTopicDraft({ ...topicDraft, description_en: e.target.value })}/></label><label className="text-xs font-bold text-slate-600">Vietnamese description<input className={inputClass} value={topicDraft.description_vi} onChange={(e) => setTopicDraft({ ...topicDraft, description_vi: e.target.value })}/></label><div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-slate-600">Order<input className={inputClass} type="number" min="0" value={topicDraft.sort_order} onChange={(e) => setTopicDraft({ ...topicDraft, sort_order: Number(e.target.value) })}/></label><label className="text-xs font-bold text-slate-600">Status<Select className="!mt-1 !h-11 !rounded-xl !border-sky-200 !text-sm" value={topicDraft.status} onChange={(e) => setTopicDraft({ ...topicDraft, status: e.target.value as ContentStatus })}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select></label></div><button disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white"><Plus size={17}/>{topicEditing ? "Save situation" : "Add situation"}</button></div>
        </form>
        <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm"><div className="border-b border-slate-100 p-4"><h2 className="font-bold text-slate-900">Situations <span className="text-slate-500">({topics.length})</span></h2><input aria-label="Search situations" className={inputClass} value={topicSearch} onChange={(e) => setTopicSearch(e.target.value)} placeholder="Search situations…"/></div>{loading ? <p className="p-6 text-sm text-slate-500">Loading…</p> : <div className="max-h-[34rem] divide-y divide-slate-100 overflow-y-auto">{filteredTopics.map((topic) => { const lessonCount = lessons.filter((lesson) => lesson.topic_id === topic.id).length; const wordCounts = topicWordCounts.get(topic.id) ?? { easy: 0, medium: 0, hard: 0 }; return <article key={topic.id} className={`flex items-center gap-2 p-3 ${selectedTopicId === topic.id ? "bg-blue-50" : ""}`}><button type="button" onClick={() => { const firstLessonId = lessons.find((lesson) => lesson.topic_id === topic.id)?.id ?? ""; setSelectedTopicId(topic.id); setSelectedLessonId(firstLessonId); setLessonEditing(null); setLessonDraft({ ...initialLesson, topic_id: topic.id }); setItemEditing(null); setItemDraft({ ...initialItem, lesson_id: firstLessonId }); }} className="min-w-0 flex-1 text-left"><span className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-900"><span className="truncate">{topic.title_en}</span><span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-blue-700">{lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}</span></span><span className="block truncate text-xs text-slate-500">{topic.title_vi} · {topic.status}</span><span className="mt-0.5 block text-[11px] font-semibold text-blue-700">Words · Easy {wordCounts.easy} / Medium {wordCounts.medium} / Hard {wordCounts.hard}</span></button><button type="button" aria-label={`Edit ${topic.title_en}`} onClick={() => editTopic(topic)} className="grid size-9 shrink-0 place-items-center rounded-lg border border-blue-100 text-blue-700"><Pencil size={15}/></button><button type="button" aria-label={`Remove ${topic.title_en}`} onClick={() => void removeTopic(topic)} className="grid size-9 shrink-0 place-items-center rounded-lg border border-rose-100 text-rose-600"><Trash2 size={15}/></button></article>; })}</div>}</section>
      </div>

      <div className="space-y-5">
        <form onSubmit={(event) => void saveLesson(event)} className="rounded-3xl border border-sky-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900">{lessonEditing ? "Edit lesson" : "Add a lesson"}</h2><p className="mt-1 text-sm text-slate-500">{currentTopic?.title_en ?? "Select a situation first."}</p></div>{lessonEditing && <button type="button" className="text-sm font-semibold text-slate-500" onClick={() => { setLessonEditing(null); setLessonDraft({ ...initialLesson, topic_id: selectedTopicId }); }}>Cancel</button>}</div>
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-600">Lesson key<input className={inputClass} value={lessonDraft.lesson_key} onChange={(e) => setLessonDraft({ ...lessonDraft, lesson_key: e.target.value })} placeholder="restaurant-booking-easy" disabled={Boolean(lessonEditing)}/></label><label className="text-xs font-bold text-slate-600">Difficulty<Select className="!mt-1 !h-11 !rounded-xl !border-sky-200 !text-sm" value={lessonDraft.difficulty} onChange={(e) => setLessonDraft({ ...lessonDraft, difficulty: e.target.value as CommunicationDifficulty })}><option value="easy">Easy · Dễ</option><option value="medium">Medium · Trung bình</option><option value="hard">Hard · Khó</option></Select></label><label className="text-xs font-bold text-slate-600">English title<input className={inputClass} value={lessonDraft.title_en} onChange={(e) => setLessonDraft({ ...lessonDraft, title_en: e.target.value })} placeholder="Booking a table"/></label><label className="text-xs font-bold text-slate-600">Vietnamese title<input className={inputClass} value={lessonDraft.title_vi} onChange={(e) => setLessonDraft({ ...lessonDraft, title_vi: e.target.value })} placeholder="Đặt bàn"/></label><label className="text-xs font-bold text-slate-600">Order<input className={inputClass} type="number" min="0" value={lessonDraft.sort_order} onChange={(e) => setLessonDraft({ ...lessonDraft, sort_order: Number(e.target.value) })}/></label><label className="text-xs font-bold text-slate-600">Status<Select className="!mt-1 !h-11 !rounded-xl !border-sky-200 !text-sm" value={lessonDraft.status} onChange={(e) => setLessonDraft({ ...lessonDraft, status: e.target.value as ContentStatus })}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select></label><button disabled={busy || !selectedTopicId} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white sm:col-span-2"><Plus size={17}/>{lessonEditing ? "Save lesson" : "Add lesson"}</button></div>
        </form>
        <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><div><h2 className="font-bold text-slate-900">Lessons <span className="text-slate-500">({currentLessons.length})</span></h2><p className="mt-1 text-sm text-slate-500">Select a lesson to manage its words, phrases, and sentence patterns.</p></div><div className="flex w-full flex-wrap gap-2 sm:w-auto"><Select aria-label="Select situation" containerClassName="min-w-0 flex-1 sm:w-64 sm:flex-none" className="!h-11 !rounded-xl !border-sky-200 !text-sm" value={selectedTopicId} onChange={(e) => { const topicId = e.target.value; const firstLessonId = lessons.find((lesson) => lesson.topic_id === topicId)?.id ?? ""; setSelectedTopicId(topicId); setSelectedLessonId(firstLessonId); setLessonEditing(null); setLessonDraft({ ...initialLesson, topic_id: topicId }); setItemEditing(null); setItemDraft({ ...initialItem, lesson_id: firstLessonId }); }}><option value="">Select situation</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.title_en}</option>)}</Select>{currentLessons.length > 0 && <button type="button" disabled={busy} onClick={() => void removeAllLessons()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 disabled:opacity-50"><Trash2 size={15}/> Delete all lessons</button>}</div></div>{!selectedTopicId ? <p className="p-6 text-sm text-slate-500">Add or select a situation.</p> : currentLessons.length === 0 ? <p className="p-6 text-sm text-slate-500">No lessons yet for this situation.</p> : <div className="divide-y divide-slate-100">{currentLessons.map((lesson) => <article key={lesson.id} className={`flex flex-wrap items-center gap-2 p-3 ${selectedLessonId === lesson.id ? "bg-blue-50/70" : ""}`}><button type="button" onClick={() => { setSelectedLessonId(lesson.id); setItemDraft({ ...initialItem, lesson_id: lesson.id }); setItemEditing(null); }} className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-bold text-slate-900">{lesson.title_en} <span className="font-medium capitalize text-blue-700">· {lesson.difficulty}</span></span><span className="block truncate text-xs text-slate-500">{lesson.title_vi} · {lesson.status} · {items.filter((item) => item.lesson_id === lesson.id).length} items</span></button><button type="button" aria-label={`Edit ${lesson.title_en}`} onClick={() => editLesson(lesson)} className="grid size-9 place-items-center rounded-lg border border-blue-100 text-blue-700"><Pencil size={15}/></button><button type="button" aria-label={`Remove ${lesson.title_en}`} onClick={() => void removeLesson(lesson)} className="grid size-9 place-items-center rounded-lg border border-rose-100 text-rose-600"><Trash2 size={15}/></button></article>)}</div>}</section>

        <form onSubmit={(event) => void saveItem(event)} className="rounded-3xl border border-sky-100 bg-white p-4 shadow-sm sm:p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900">{itemEditing ? "Edit learning item" : "Add a learning item"}</h2><p className="mt-1 text-sm text-slate-500">Items connect words, useful phrases, and sentence patterns.</p></div>{itemEditing && <button type="button" className="text-sm font-semibold text-slate-500" onClick={() => { setItemEditing(null); setItemDraft({ ...initialItem, lesson_id: selectedLessonId }); }}>Cancel</button>}</div><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-600">Item key<input className={inputClass} value={itemDraft.item_key} onChange={(e) => setItemDraft({ ...itemDraft, item_key: e.target.value })} placeholder="reservation-phrase" disabled={Boolean(itemEditing)}/></label><label className="text-xs font-bold text-slate-600">Type<Select className="!mt-1 !h-11 !rounded-xl !border-sky-200 !text-sm" value={itemDraft.item_type} onChange={(e) => setItemDraft({ ...itemDraft, item_type: e.target.value as ItemDraft["item_type"] })}><option value="word">Word</option><option value="phrase">Useful phrase</option><option value="sentence_pattern">Sentence pattern</option></Select></label><label className="text-xs font-bold text-slate-600">English content<input className={inputClass} value={itemDraft.content_en} onChange={(e) => setItemDraft({ ...itemDraft, content_en: e.target.value })} placeholder="make a reservation"/></label><label className="text-xs font-bold text-slate-600">Vietnamese meaning<input className={inputClass} value={itemDraft.meaning_vi} onChange={(e) => setItemDraft({ ...itemDraft, meaning_vi: e.target.value })} placeholder="đặt chỗ"/></label><label className="text-xs font-bold text-slate-600">Example in English<input className={inputClass} value={itemDraft.example_en} onChange={(e) => setItemDraft({ ...itemDraft, example_en: e.target.value })} placeholder="I'd like to make a reservation."/></label><label className="text-xs font-bold text-slate-600">Example in Vietnamese<input className={inputClass} value={itemDraft.example_vi} onChange={(e) => setItemDraft({ ...itemDraft, example_vi: e.target.value })} placeholder="Tôi muốn đặt bàn."/></label><label className="text-xs font-bold text-slate-600">Image keyword<input className={inputClass} value={itemDraft.image_keyword} onChange={(e) => setItemDraft({ ...itemDraft, image_keyword: e.target.value })} placeholder="restaurant table"/></label><label className="text-xs font-bold text-slate-600">Audio URL<input className={inputClass} type="url" value={itemDraft.audio_url} onChange={(e) => setItemDraft({ ...itemDraft, audio_url: e.target.value })} placeholder="https://…"/></label><label className="text-xs font-bold text-slate-600">Order<input className={inputClass} type="number" min="0" value={itemDraft.sort_order} onChange={(e) => setItemDraft({ ...itemDraft, sort_order: Number(e.target.value) })}/></label><button disabled={busy || !selectedLessonId} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white"><Plus size={17}/>{itemEditing ? "Save item" : "Add item"}</button></div><p className="mt-3 text-xs text-slate-500">Dialogue scenarios and turns are included in the CSV import/export format.</p></form>
        <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><div><h2 className="font-bold text-slate-900">Lesson content <span className="text-slate-500">({currentItems.length})</span></h2><p className="mt-1 text-sm text-slate-500">{lessons.find((lesson) => lesson.id === selectedLessonId)?.title_en ?? "Select a lesson above."}</p></div>{currentItems.length > 0 && <button type="button" disabled={busy} onClick={() => void removeAllItems()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 disabled:opacity-50"><Trash2 size={15}/> Delete all items</button>}</div>{!selectedLessonId ? <p className="p-6 text-sm text-slate-500">Select a lesson to see its items.</p> : currentItems.length === 0 ? <p className="p-6 text-sm text-slate-500">No learning items yet.</p> : <div className="divide-y divide-slate-100">{currentItems.map((item) => <article key={item.id} className="flex flex-wrap items-center gap-2 p-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-slate-900">{item.content_en}</strong><span className="rounded-full bg-blue-50 px-2 py-1 text-xs capitalize text-blue-700">{item.item_type.replace("_", " ")}</span></div><p className="mt-1 text-sm text-slate-500">{item.meaning_vi}{item.example_en ? ` · ${item.example_en}` : ""}</p></div><button type="button" onClick={() => editItem(item)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-blue-200 px-3 text-sm font-semibold text-blue-700"><Pencil size={15}/> Edit</button><button type="button" onClick={() => void removeItem(item)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700"><Trash2 size={15}/> Remove</button></article>)}</div>}</section>
      </div>
    </section>
  </main>;
}
