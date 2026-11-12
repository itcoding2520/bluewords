import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

type LessonAvailabilityStateProps = {
  state: "loading" | "unavailable" | "empty";
};

export function LessonAvailabilityState({ state }: LessonAvailabilityStateProps) {
  if (state === "loading") {
    return <main className="rounded-3xl border border-sky-100 bg-white p-8 text-center text-slate-500">Loading lesson…</main>;
  }

  if (state === "unavailable") {
    return (
      <main className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-xl font-bold text-slate-900">Lesson unavailable</h1>
        <p className="mt-2 text-sm text-slate-600">This lesson may be unpublished or removed.</p>
        <Link className="mt-4 inline-flex font-bold text-blue-700" href="/communication"><ArrowLeft size={17} /> Back to situations</Link>
      </main>
    );
  }

  return (
    <section className="rounded-3xl border border-dashed border-sky-200 bg-white p-10 text-center">
      <BookOpen className="mx-auto text-blue-400" size={34} />
      <p className="mt-3 font-bold text-slate-900">This lesson is being prepared</p>
      <p className="mt-1 text-sm text-slate-500">Learning items will appear here when they are added.</p>
    </section>
  );
}
