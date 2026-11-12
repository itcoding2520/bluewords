import { BookOpen, BriefcaseBusiness, BusFront, CalendarDays, GraduationCap, Headphones, HeartPulse, House, Luggage, Landmark, PartyPopper, ShieldAlert, ShoppingBag, Smartphone, Utensils, UsersRound, Volleyball, CloudSun, type LucideIcon } from "lucide-react";

import { SituationCard } from "@/components/communication/SituationCard";
import type { Lesson, Progress, Topic } from "@/hooks/useSituationalEnglishCatalogData";

const topicIcons: Record<string, LucideIcon> = {
  "greetings-introductions": UsersRound, "family-friends": UsersRound, "daily-routines": CalendarDays,
  "work-colleagues": BriefcaseBusiness, "food-restaurants": Utensils, "shopping-payments": ShoppingBag,
  "transport-directions": BusFront, "travel-hotels": Luggage, "health-feelings": HeartPulse,
  "hobbies-free-time": Volleyball, "time-appointments": CalendarDays, "phone-online": Smartphone,
  "education-classes": GraduationCap, "home-neighborhood": House, "weather-seasons": CloudSun,
  "money-banking": Landmark, "plans-invitations": PartyPopper, "customer-service": Headphones,
  "emergencies-safety": ShieldAlert, "technology-devices": Smartphone,
};

const topicAccents = [
  "border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 text-blue-700",
  "border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 text-violet-700",
  "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700",
  "border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 text-amber-700",
  "border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 text-rose-700",
  "border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700",
];

type SituationResultsProps = {
  loading: boolean;
  authenticated: boolean;
  topics: Topic[];
  visibleLessonsByTopic: Map<string, Lesson[]>;
  progressByLesson: Map<string, Progress>;
  completedLevelsByTopic: Map<string, Set<Lesson["difficulty"]>>;
};

export function SituationResults({
  loading,
  authenticated,
  topics,
  visibleLessonsByTopic,
  progressByLesson,
  completedLevelsByTopic,
}: SituationResultsProps) {
  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="h-52 animate-pulse rounded-2xl bg-sky-50" />
        <div className="h-52 animate-pulse rounded-2xl bg-sky-50" />
        <div className="h-52 animate-pulse rounded-2xl bg-sky-50" />
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/40 p-10 text-center">
        <BookOpen className="mx-auto text-blue-400" size={32} />
        <p className="mt-3 font-bold text-slate-800">No published lessons yet</p>
        <p className="mt-1 text-sm text-slate-500">New lessons will appear here after an admin publishes them.</p>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
      {topics.map((topic, index) => (
        <SituationCard
          key={topic.id}
          topic={topic}
          lessons={visibleLessonsByTopic.get(topic.id) ?? []}
          progressByLesson={progressByLesson}
          completedLevels={completedLevelsByTopic.get(topic.id) ?? new Set()}
          authenticated={authenticated}
          accent={topicAccents[index % topicAccents.length]}
          TopicIcon={topicIcons[topic.slug]}
        />
      ))}
    </div>
  );
}
