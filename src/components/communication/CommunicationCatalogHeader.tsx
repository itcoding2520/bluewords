import Link from "next/link";
import { ArrowRight, BookOpen, FileText, MessageCircle, Sparkles, UsersRound } from "lucide-react";

type CommunicationCatalogHeaderProps = {
  authenticated: boolean;
  nextStepHref: string | null;
  nextStepLabel: string;
  nextStepReason: string;
};

export function CommunicationCatalogHeader({
  authenticated,
  nextStepHref,
  nextStepLabel,
  nextStepReason,
}: CommunicationCatalogHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-[1.75rem] border border-sky-100 bg-gradient-to-r from-white via-sky-50 to-cyan-100 p-5 shadow-[0_14px_36px_rgb(37_99_235/0.08)] sm:p-7">
      <div className="relative z-10 max-w-4xl">
        <span className="text-sm font-bold text-blue-600">Everyday English · Tiếng Anh giao tiếp</span>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-[#102969] sm:text-4xl">Learn by situation</h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">Build useful words and practice real conversations for everyday life.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-slate-800 shadow-sm sm:gap-3 sm:px-4 sm:text-sm">
            <span className="inline-flex items-center gap-1.5"><BookOpen size={17} className="text-blue-600" />Word</span>
            <ArrowRight size={14} className="text-slate-400" />
            <span className="inline-flex items-center gap-1.5"><MessageCircle size={17} className="text-blue-600" />Phrase</span>
            <ArrowRight size={14} className="text-slate-400" />
            <span className="inline-flex items-center gap-1.5"><FileText size={17} className="text-blue-600" />Sentence</span>
            <ArrowRight size={14} className="text-slate-400" />
            <span className="inline-flex items-center gap-1.5"><UsersRound size={17} className="text-blue-600" />Dialogue</span>
          </div>
          {authenticated && nextStepHref && (
            <Link href={nextStepHref} className="group inline-flex min-h-[3.75rem] max-w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:shadow-xl sm:px-5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15"><ArrowRight size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-extrabold uppercase tracking-[.14em] text-blue-100">Next step</span>
                <span className="block truncate text-sm font-extrabold leading-5">{nextStepLabel}</span>
                <span className="block truncate text-xs leading-4 text-blue-100">{nextStepReason}</span>
              </span>
            </Link>
          )}
        </div>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-12 hidden size-56 place-items-center rounded-full bg-white/45 text-blue-300 sm:grid">
        <MessageCircle size={88} />
        <span className="absolute grid size-14 place-items-center rounded-full bg-white text-blue-500 shadow-sm">
          <span className="flex gap-1"><i className="size-2 rounded-full bg-blue-400" /><i className="size-2 rounded-full bg-blue-500" /><i className="size-2 rounded-full bg-blue-600" /></span>
        </span>
        <Sparkles className="absolute right-9 top-10 text-amber-400" size={24} />
      </div>
    </header>
  );
}
