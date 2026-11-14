import type { Lesson, Topic } from "@/lib/communication/lesson-types";

export function LessonProgressHeader({ lesson, topic, masteredCount, itemCount }: {
  lesson: Lesson;
  topic: Topic;
  masteredCount: number;
  itemCount: number;
}) {
  const progress = itemCount ? masteredCount / itemCount * 100 : 0;

  return <header className="rounded-3xl border border-sky-100 bg-gradient-to-r from-white via-sky-50 to-cyan-100 p-5 sm:p-7">
    <p className="text-sm font-bold text-blue-600">{topic.title_en} · {topic.title_vi}</p>
    <h1 className="page-title mt-1 text-3xl sm:text-4xl">{lesson.title_en}</h1>
    <p className="mt-1 text-slate-600">{lesson.title_vi} <span className="mx-1">·</span><span className="capitalize">{lesson.difficulty}</span></p>
    <div className="mt-4 flex items-center gap-3">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-sky-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }}/></div>
      <span className="text-sm font-bold text-slate-700">{masteredCount}/{itemCount} mastered</span>
    </div>
  </header>;
}
