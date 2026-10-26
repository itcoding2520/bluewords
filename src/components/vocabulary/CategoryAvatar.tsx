"use client";

import Image from "next/image";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { getCategoryImageUrl } from "@/lib/supabase/category-images";

export function CategoryAvatar({
  name,
  imagePath,
  fallbackWordImagePath,
  colorClass = "bg-slate-300",
  sizeClass = "size-7",
  shapeClass = "rounded-full",
}: {
  name: string;
  imagePath?: string | null;
  fallbackWordImagePath?: string | null;
  colorClass?: string;
  sizeClass?: string;
  shapeClass?: string;
}) {
  const wordImageUrl = useVocabularyImageUrl(imagePath ? null : fallbackWordImagePath);
  const imageUrl = imagePath ? getCategoryImageUrl(imagePath) : wordImageUrl;
  return imageUrl
    ? <Image src={imageUrl} alt="" title={name} width={40} height={40} unoptimized className={`${sizeClass} shrink-0 ${shapeClass} object-cover`} />
    : <span aria-hidden="true" title={name} className={`${sizeClass} shrink-0 ${shapeClass} ${colorClass}`} />;
}

export function CategoryIdentity({
  name,
  imagePath,
  fallbackWordImagePath,
  colorClass,
  author,
  shapeClass,
}: {
  name: string;
  imagePath?: string | null;
  fallbackWordImagePath?: string | null;
  colorClass?: string;
  author?: string | null;
  shapeClass?: string;
}) {
  return <span className="flex min-w-0 items-center gap-2">
    <CategoryAvatar name={name} imagePath={imagePath} fallbackWordImagePath={fallbackWordImagePath} colorClass={colorClass} shapeClass={shapeClass} />
    <span className="min-w-0">
      <span className="block truncate">{name}</span>
      {author && <span className="block truncate text-xs font-normal opacity-75">By {author}</span>}
    </span>
  </span>;
}
