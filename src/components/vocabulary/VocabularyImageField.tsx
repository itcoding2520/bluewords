"use client";

import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";

type VocabularyImageFieldProps = {
  previewUrl: string | null;
  hasSelectedImage: boolean;
  hasExistingImage: boolean;
  error?: string;
  disabled: boolean;
  onSelect: (file: File | null) => void;
  onRemove: () => void;
};

export function VocabularyImageField({
  previewUrl,
  hasSelectedImage,
  hasExistingImage,
  error,
  disabled,
  onSelect,
  onRemove,
}: VocabularyImageFieldProps) {
  return (
    <div>
      <label htmlFor="vocabulary-image" className="text-sm font-medium text-slate-700">
        Illustration <span className="font-normal text-slate-400">(optional, max 5 MB)</span>
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {previewUrl && (
          <Image
            src={previewUrl}
            alt="Vocabulary illustration preview"
            width={64}
            height={64}
            unoptimized
            className="size-16 rounded-xl border border-slate-200 object-cover"
          />
        )}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <ImagePlus size={16} />
          {hasSelectedImage || hasExistingImage ? "Change image" : "Choose image"}
          <input
            id="vocabulary-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={disabled}
            onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
          />
        </label>
        {(hasSelectedImage || hasExistingImage) && (
          <button
            type="button"
            disabled={disabled}
            onClick={onRemove}
            className="cursor-pointer text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            Remove image
          </button>
        )}
      </div>
      {error && <AutoDismissMessage key={error} variant="error" className="mt-1.5 bg-transparent p-0 text-xs font-medium text-red-500">{error}</AutoDismissMessage>}
      <p className="mt-1.5 text-xs text-slate-400">JPEG, PNG, or WebP. Images are private to your account.</p>
    </div>
  );
}
