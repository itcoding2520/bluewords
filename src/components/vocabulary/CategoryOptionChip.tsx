"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useVocabularyCategoryOptionImageUrl } from "@/hooks/useVocabularyCategoryOptionImageUrl";

export function CategoryOptionChip({
  name,
  imagePath,
  dotClassName,
  selected,
  onClick,
  fallbackIcon,
  className = "",
}: {
  name: string;
  imagePath?: string | null;
  dotClassName: string;
  selected: boolean;
  onClick: () => void;
  fallbackIcon?: ReactNode;
  className?: string;
}) {
  const imageUrl = useVocabularyCategoryOptionImageUrl(imagePath);
  const buttonClassName = [
    className,
    "flex h-10 min-w-0 items-center gap-1.5 rounded-full border px-2 text-left text-xs transition sm:gap-2 sm:px-2.5",
    selected
      ? "border-indigo-200 bg-indigo-50 font-semibold text-indigo-700"
      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50",
  ].filter(Boolean).join(" ");

  return (
    <button type="button" aria-pressed={selected} onClick={onClick} title={name} className={buttonClassName}>
      {fallbackIcon ?? (imageUrl
        ? <Image src={imageUrl} alt="" width={24} height={24} unoptimized className="size-6 shrink-0 rounded-full object-cover" />
        : <span className={["size-2 shrink-0 rounded-full", dotClassName].join(" ")} aria-hidden="true" />)}
      <span className="min-w-0 truncate">{name}</span>
    </button>
  );
}
