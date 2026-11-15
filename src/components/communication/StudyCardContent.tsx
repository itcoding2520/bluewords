import type { Item } from "@/lib/communication/lesson-types";

export function StudyCardContent({ item, revealed, onReveal }: {
  item: Item;
  revealed: boolean;
  onReveal: () => void;
}) {
  return (
    <article className="rounded-3xl bg-gradient-to-br from-sky-50 to-white p-6 text-center sm:p-10">
      <h2 className="break-words text-3xl font-extrabold text-slate-900 sm:text-4xl">{item.content_en}</h2>
      {revealed ? (
        <div className="mt-5 space-y-2">
          <p className="text-xl font-bold text-blue-700">{item.meaning_vi}</p>
          {item.example_en && <p className="mx-auto max-w-2xl text-lg text-slate-700">{item.example_en}</p>}
          {item.example_vi && <p className="text-sm text-slate-500">{item.example_vi}</p>}
        </div>
      ) : (
        <button type="button" onClick={onReveal} className="mt-6 min-h-11 rounded-full border border-blue-300 bg-white px-6 text-sm font-bold text-blue-700 shadow-sm">Show meaning</button>
      )}
    </article>
  );
}
