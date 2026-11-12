import Link from "next/link";
import { ArrowRight, BookOpen, type LucideIcon } from "lucide-react";

import type { Lesson, Progress, Topic } from "@/hooks/useSituationalEnglishCatalogData";

const difficultyLabel = { easy: "Easy · Dễ", medium: "Medium · Trung bình", hard: "Hard · Khó" };
const requiredLevels = ["easy", "medium", "hard"] as const;

type SituationCardProps = {
  topic: Topic;
  lessons: Lesson[];
  progressByLesson: Map<string, Progress>;
  completedLevels: Set<Lesson["difficulty"]>;
  authenticated: boolean;
  accent: string;
  TopicIcon?: LucideIcon;
};

export function SituationCard({
  topic,
  lessons,
  progressByLesson,
  completedLevels,
  authenticated,
  accent,
  TopicIcon = BookOpen,
}: SituationCardProps) {
  const allLevelsCompleted = requiredLevels.every((level) => completedLevels.has(level));

  return (
    <article className={`overflow-hidden rounded-2xl border p-3 ${accent}`}>
      <div className="flex min-h-[5.1rem] items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/80 shadow-sm">
          <TopicIcon size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-extrabold uppercase tracking-wide">{topic.title_vi}</p>
          <h3 className="truncate text-base font-extrabold text-slate-900">{topic.title_en}</h3>
          <p className="mt-0.5 line-clamp-2 min-h-8 text-xs leading-4 text-slate-600">{topic.description_en}</p>
        </div>
      </div>

      <div className="mb-1 flex justify-end text-[11px] font-semibold text-slate-500">
        {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
        {authenticated && allLevelsCompleted && <span className="ml-1 text-emerald-700">· Completed</span>}
        {authenticated && !allLevelsCompleted && completedLevels.size > 0 && <span className="ml-1">· {completedLevels.size}/3 levels</span>}
      </div>

      <div className="overflow-hidden rounded-xl border border-white/90 bg-white/90">
        {lessons.map((lesson) => {
          const lessonProgress = progressByLesson.get(lesson.id);
          const status = lessonProgress?.status === "completed"
            ? "Completed"
            : lessonProgress?.status === "in_progress"
              ? "Continue"
              : "Start";
          const statusDot = lessonProgress?.status === "in_progress" ? "bg-amber-400" : "bg-emerald-500";

          return (
            <Link
              key={lesson.id}
              href={`/communication/${lesson.id}`}
              className="group flex min-h-8 items-center gap-2 border-b border-slate-100 px-2.5 py-1.5 last:border-b-0 hover:bg-blue-50/70"
            >
              <span className={`size-2 shrink-0 rounded-full ${statusDot}`} />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">{lesson.title_en}</span>
              <span className="hidden shrink-0 text-[11px] text-slate-500 sm:inline">{difficultyLabel[lesson.difficulty]}</span>
              <span className="shrink-0 text-[11px] font-bold text-blue-600">{status}</span>
              <ArrowRight size={13} className="shrink-0 text-blue-600 transition group-hover:translate-x-0.5" />
            </Link>
          );
        })}
      </div>
    </article>
  );
}
