"use client";

import { useRef, useState } from "react";
import { Check, Circle } from "lucide-react";

import type { VocabularyWord } from "@/data/vocabulary";
import { cn } from "@/lib/cn";

interface VocabularyMasteryStatusProps {
  item: Pick<VocabularyWord, "id" | "word" | "status">;
  onToggleMastered: (
    id: string,
    currentStatus: VocabularyWord["status"]
  ) => Promise<boolean>;
}

export function VocabularyMasteryStatus({
  item,
  onToggleMastered,
}: VocabularyMasteryStatusProps) {
  const [isToggling, setIsToggling] = useState(false);
  const togglingRef = useRef(false);
  const mastered = item.status === "mastered";

  async function handleToggleMastered() {
    if (togglingRef.current) return;

    togglingRef.current = true;
    setIsToggling(true);

    try {
      await onToggleMastered(item.id, item.status);
    } finally {
      togglingRef.current = false;
      setIsToggling(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleToggleMastered()}
      disabled={isToggling}
      aria-label={`Mark ${item.word} as ${mastered ? "learning" : "mastered"}`}
      aria-pressed={mastered}
      aria-busy={isToggling}
      className={cn(
        "inline-flex w-fit shrink-0 cursor-pointer items-center gap-1.5 rounded-lg py-1 text-sm font-medium transition",
        "lg:col-start-5 lg:row-auto",
        "disabled:cursor-wait disabled:opacity-60",
        mastered
          ? "text-emerald-600 hover:text-emerald-700"
          : "text-amber-600 hover:text-amber-700"
      )}
    >
      {mastered ? <Check size={15} /> : <Circle size={14} />}
      {isToggling ? "Saving..." : mastered ? "Mastered" : "Learning"}
    </button>
  );
}
