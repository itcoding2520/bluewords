import type { Item } from "@/lib/communication/lesson-types";
import type { SentenceDrill } from "@/lib/communication/lesson-practice";

type OrderedTile = { id: number; text: string };

export function SentenceWordOrderExercise({
  drill,
  answer,
  orderedTiles,
  saving,
  onSubmit,
  onOrderedTilesChange,
}: {
  drill: SentenceDrill<Item>;
  answer: string | null;
  orderedTiles: OrderedTile[];
  saving: boolean;
  onSubmit: (answer: string) => void;
  onOrderedTilesChange: (tiles: OrderedTile[]) => void;
}) {
  const orderedTileIds = new Set(orderedTiles.map((tile) => tile.id));
  const selectTile = (tile: OrderedTile) => onOrderedTilesChange([...orderedTiles, tile]);
  const removeTile = (tileId: number) => onOrderedTilesChange(orderedTiles.filter((tile) => tile.id !== tileId));

  return (
    <>
      <div className="mt-4 flex min-h-14 flex-wrap items-center justify-center gap-2 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 p-3">
        {orderedTiles.map((tile) => <button key={tile.id} type="button" disabled={answer !== null} onClick={() => removeTile(tile.id)} className="rounded-xl border border-blue-200 bg-white px-3 py-2 font-bold text-blue-900">{tile.text}</button>)}
        {orderedTiles.length === 0 && <span className="text-sm text-slate-400">Your sentence will appear here</span>}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {drill.tiles?.filter((tile) => !orderedTileIds.has(tile.id)).map((tile) => <button key={tile.id} type="button" disabled={answer !== null || saving} onClick={() => selectTile(tile)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-800 shadow-sm hover:border-blue-300">{tile.text}</button>)}
      </div>
      <div className="mt-4 flex justify-center gap-2">
        <button type="button" disabled={orderedTiles.length === 0 || answer !== null} onClick={() => onOrderedTilesChange([])} className="min-h-10 rounded-full border border-slate-200 px-4 text-sm font-bold text-slate-600 disabled:opacity-40">Clear</button>
        <button type="button" disabled={orderedTiles.length !== drill.tiles?.length || answer !== null || saving} onClick={() => onSubmit(orderedTiles.map((tile) => tile.text).join(" "))} className="min-h-10 rounded-full bg-blue-600 px-5 text-sm font-bold text-white disabled:opacity-40">Check sentence</button>
      </div>
    </>
  );
}
