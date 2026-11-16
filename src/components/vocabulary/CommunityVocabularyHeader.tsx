import Image from "next/image";

export function CommunityVocabularyHeader({ count }: { count: number }) {
  return (
    <div className="community-vocabulary-heading flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-violet-100">
          <Image
            src="/images/ui/icons/community.png"
            alt=""
            width={28}
            height={28}
            className="size-7 object-contain"
          />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-indigo-950">Community vocabulary</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Approved custom words from other signed-in learners.
          </p>
        </div>
      </div>
      <span className="community-vocabulary-count rounded-full border border-violet-100 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700">
        {count} words
      </span>
    </div>
  );
}
