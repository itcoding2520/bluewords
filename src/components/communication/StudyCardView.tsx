"use client";

import { Volume2 } from "lucide-react";
import type { Item } from "@/lib/communication/lesson-types";
import { StudyCardContent } from "@/components/communication/StudyCardContent";
import { StudyCardControls } from "@/components/communication/StudyCardControls";
import type { LearningStatus } from "@/types/learning";

export function StudyCardView({
  item,
  index,
  itemCount,
  revealed,
  status,
  saving,
  onReveal,
  onStatusChange,
  onPrevious,
  onNext,
  onListen,
}: {
  item: Item;
  index: number;
  itemCount: number;
  revealed: boolean;
  status: LearningStatus;
  saving: boolean;
  onReveal: () => void;
  onStatusChange: (status: LearningStatus) => void;
  onPrevious: () => void;
  onNext: () => void;
  onListen: () => void;
}) {
  return (
    <div className="p-4 sm:p-7">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">{item.item_type.replace("_", " ")}</p>
          <p className="mt-1 text-sm text-slate-500">Item {index + 1} of {itemCount}</p>
        </div>
        <button type="button" onClick={onListen} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-sky-200 px-4 text-sm font-semibold text-blue-700"><Volume2 size={17}/> Listen</button>
      </div>
      <StudyCardContent item={item} revealed={revealed} onReveal={onReveal} />
      <StudyCardControls
        index={index}
        itemCount={itemCount}
        revealed={revealed}
        status={status}
        saving={saving}
        onStatusChange={onStatusChange}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </div>
  );
}
