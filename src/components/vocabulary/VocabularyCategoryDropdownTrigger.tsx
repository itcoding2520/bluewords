import type { KeyboardEventHandler, Ref } from "react";
import { ChevronDown, ListFilter } from "lucide-react";

import { CategoryAvatar } from "@/components/vocabulary/CategoryAvatar";
import { CATEGORY_COLOR_STYLES, CATEGORY_TRIGGER_STYLES } from "@/components/vocabulary/category-dropdown-styles";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";

export function VocabularyCategoryDropdownTrigger({
  id,
  triggerRef,
  ariaLabel,
  listboxId,
  isOpen,
  selectedCategory,
  selectedName,
  fallbackWordImagePath,
  onClick,
  onKeyDown,
}: {
  id?: string;
  triggerRef: Ref<HTMLButtonElement>;
  ariaLabel: string;
  listboxId: string;
  isOpen: boolean;
  selectedCategory?: VocabularyCategoryRow;
  selectedName?: string;
  fallbackWordImagePath?: string;
  onClick: () => void;
  onKeyDown: KeyboardEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      id={id}
      ref={triggerRef}
      type="button"
      aria-label={ariaLabel}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      aria-controls={listboxId}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={`group flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3 text-left text-sm font-medium shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
        selectedCategory
          ? `${CATEGORY_TRIGGER_STYLES[selectedCategory.color]} text-white focus-visible:ring-blue-200`
          : "border-blue-100 bg-blue-50/70 text-slate-700 hover:border-blue-200 hover:bg-blue-50"
      }`}
    >
      {selectedCategory ? (
        <CategoryAvatar
          name={selectedCategory.name}
          imagePath={selectedCategory.image_path}
          fallbackWordImagePath={fallbackWordImagePath}
          colorClass={CATEGORY_COLOR_STYLES[selectedCategory.color]}
        />
      ) : (
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
          <ListFilter size={15} aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">
        {selectedName ?? "Select category"}
      </span>
      <ChevronDown
        size={16}
        aria-hidden="true"
        className={`shrink-0 transition-transform duration-200 ${
          selectedCategory ? "text-white/90" : "text-slate-500"
        } ${isOpen ? "rotate-180" : ""}`}
      />
    </button>
  );
}
