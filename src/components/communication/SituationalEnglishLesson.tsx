"use client";

import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { ConversationPractice } from "@/components/communication/ConversationPractice";
import { LessonModeContent } from "@/components/communication/LessonModeContent";
import { LessonProgressHeader } from "@/components/communication/LessonProgressHeader";
import { LessonModeTabs } from "@/components/communication/LessonModeTabs";
import { LessonAvailabilityState } from "@/components/communication/LessonAvailabilityState";
import { useSituationalEnglishLessonController } from "@/hooks/useSituationalEnglishLessonController";

export function SituationalEnglishLesson({ lessonId, reviewItem }: { lessonId: string; reviewItem?: string }) {
  const lessonView = useSituationalEnglishLessonController(lessonId, reviewItem);
  const { lesson, topic, items, dialogues, userId, loading, masteredCount, mode, tabs, modes, onSelectMode, onPlayTurn } = lessonView;

  if (loading) return <LessonAvailabilityState state="loading" />;
  if (!lesson || !topic) return <LessonAvailabilityState state="unavailable" />;

  return <main className="space-y-5">
    <Link href="/communication" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-bold text-white"><ArrowLeft size={17}/> All situations</Link>
    <LessonProgressHeader lesson={lesson} topic={topic} masteredCount={masteredCount} itemCount={items.length}/>
    {!userId && <aside className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><LockKeyhole size={18}/> Sign in to record completed items and build your review schedule. <Link href="/login" className="font-bold underline">Log in</Link></aside>}
    {items.length === 0 ? <LessonAvailabilityState state="empty" /> : <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
      <LessonModeTabs
        mode={mode}
        {...tabs}
        onSelect={onSelectMode}
      />
      <LessonModeContent mode={mode} {...modes} />
    </section>}
    <ConversationPractice dialogues={dialogues} onPlayTurn={onPlayTurn}/>
  </main>;
}
