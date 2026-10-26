
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { Check, ChevronDown, ListFilter, Search, X } from "lucide-react";

import type { VocabularyCategory } from "@/config/vocabulary";
import type {
  VocabularyCategoryColor,
  VocabularyCategoryRow,
} from "@/lib/supabase/categories";
import type { VocabularyWord } from "@/data/vocabulary";
import { CategoryAvatar } from "@/components/vocabulary/CategoryAvatar";

const CATEGORY_COLOR_STYLES: Record<VocabularyCategoryColor, string> = {
  blue: "bg-blue-700",
  violet: "bg-[#bf00ff]",
  orange: "bg-[#ff990a]",
  green: "bg-emerald-700",
  rose: "bg-rose-700",
  indigo: "bg-indigo-700",
  teal: "bg-teal-700",
  amber: "bg-amber-700",
  pink: "bg-pink-700",
  slate: "bg-slate-700",
};

const CATEGORY_TRIGGER_STYLES: Record<VocabularyCategoryColor, string> = {
  blue: "border-blue-700 bg-blue-700 hover:border-blue-800 hover:bg-blue-800",
  violet: "border-[#bf00ff] bg-[#bf00ff] hover:brightness-95",
  orange: "border-[#ff990a] bg-[#ff990a] hover:brightness-95",
  green: "border-emerald-700 bg-emerald-700 hover:border-emerald-800 hover:bg-emerald-800",
  rose: "border-rose-700 bg-rose-700 hover:border-rose-800 hover:bg-rose-800",
  indigo: "border-indigo-700 bg-indigo-700 hover:border-indigo-800 hover:bg-indigo-800",
  teal: "border-teal-700 bg-teal-700 hover:border-teal-800 hover:bg-teal-800",
  amber: "border-amber-700 bg-amber-700 hover:border-amber-800 hover:bg-amber-800",
  pink: "border-pink-700 bg-pink-700 hover:border-pink-800 hover:bg-pink-800",
  slate: "border-slate-700 bg-slate-700 hover:border-slate-800 hover:bg-slate-800",
};

export type CategoryFilter = "All" | VocabularyCategory;

interface VocabularyToolbarProps {
  search: string;
  category: CategoryFilter;
  categories: VocabularyCategoryRow[];
  words: VocabularyWord[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: CategoryFilter) => void;
}

interface FilterButtonProps {
  children: ReactNode;
  active?: boolean;
  onClick: () => void;
}

function FilterButton({
  children,
  active = false,
  onClick,
}: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "shrink-0 whitespace-nowrap rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
          : "cursor-pointer shrink-0 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
      }
    >
      {children}
    </button>
  );
}

interface CategoryDropdownProps {
  category: string;
  categories: VocabularyCategoryRow[];
  words: VocabularyWord[];
  onChange: (value: string) => void;
  includeAll?: boolean;
  allLabel?: string;
  fullWidth?: boolean;
}

export function CategoryDropdown({
  category,
  categories,
  words,
  onChange,
  includeAll = false,
  allLabel = "All categories",
  fullWidth = false,
}: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const listboxId = useId();
  const options = [
    ...(includeAll
      ? [{ id: "all-categories", name: allLabel, value: "all", color: null }]
      : []),
    ...categories.map((item) => ({ ...item, value: item.name })),
  ];
  const selectedOption = options.find((item) => item.value === category);
  const selectedCategory = selectedOption?.color
    ? categories.find((item) => item.name === selectedOption.name)
    : undefined;

  useEffect(() => {
    if (!isOpen) return;

    requestAnimationFrame(() => optionRefs.current[activeIndex]?.focus());
  }, [isOpen, activeIndex]);

  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, [isOpen]);

  function openMenu() {
    if (options.length === 0) return;
    const selectedIndex = options.findIndex((item) => item.value === category);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  }

  function chooseCategory(name: string) {
    onChange(name);
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (isOpen) {
        const delta = event.key === "ArrowDown" ? 1 : -1;
        const nextIndex = (activeIndex + delta + options.length) % options.length;
        setActiveIndex(nextIndex);
        optionRefs.current[nextIndex]?.focus();
      } else {
        openMenu();
      }
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (isOpen) setIsOpen(false);
      else openMenu();
    } else if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
    }
  }

  function handleOptionKeyDown(
    event: ReactKeyboardEvent<HTMLDivElement>,
    index: number
  ) {
    let nextIndex = index;

    if (event.key === "ArrowDown") nextIndex = (index + 1) % options.length;
    else if (event.key === "ArrowUp") nextIndex = (index - 1 + options.length) % options.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = options.length - 1;
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      chooseCategory(options[index].value);
      return;
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    } else {
      return;
    }

    event.preventDefault();
    setActiveIndex(nextIndex);
    optionRefs.current[nextIndex]?.focus();
  }

  return (
    <div
      ref={rootRef}
      className={`relative min-w-0 ${fullWidth ? "w-full max-w-none flex-none" : "max-w-[240px] flex-1"}`}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label="Filter vocabulary by category"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        className={`group flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3 text-left text-sm font-medium shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
          selectedCategory
            ? `${CATEGORY_TRIGGER_STYLES[selectedCategory.color]} text-white focus-visible:ring-blue-200`
            : "border-blue-100 bg-blue-50/70 text-slate-700 hover:border-blue-200 hover:bg-blue-50"
        }`}
      >
        {selectedCategory ? <CategoryAvatar name={selectedCategory.name} imagePath={selectedCategory.image_path} fallbackWordImagePath={words.find((word) => word.category.trim().toLocaleLowerCase() === selectedCategory.name.trim().toLocaleLowerCase() && word.imagePath)?.imagePath} colorClass={CATEGORY_COLOR_STYLES[selectedCategory.color]} /> : <span className={`grid size-7 shrink-0 place-items-center rounded-lg shadow-sm ring-1 ${
          selectedCategory
            ? "bg-white/20 text-white ring-white/20"
            : "bg-white text-blue-600 ring-blue-100"
        }`}>
          <ListFilter size={15} aria-hidden="true" />
        </span>}
        <span className="min-w-0 flex-1 truncate">
          {selectedOption?.name ?? "Select category"}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 transition-transform duration-200 ${
            selectedCategory ? "text-white/90" : "text-slate-500"
          } ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Vocabulary categories"
          className="hide-scrollbar absolute right-0 z-50 mt-2 max-h-72 w-full min-w-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 ring-1 ring-slate-950/5"
        >
          <div className="border-b border-slate-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Choose a category
          </div>
          {options.map((item, index) => {
            const isSelected = item.value === category;
            const isActive = index === activeIndex;
            const itemColor = item.color;

            return (
              <div
                key={item.id}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                role="option"
                aria-selected={isSelected}
                tabIndex={isActive ? 0 : -1}
                onClick={() => chooseCategory(item.value)}
                onFocus={() => setActiveIndex(index)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none ${
                  isSelected && itemColor
                    ? `${CATEGORY_TRIGGER_STYLES[itemColor]} font-semibold text-white`
                    : isSelected
                      ? "bg-slate-950 font-semibold text-white"
                    : isActive
                      ? "bg-slate-50 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  {itemColor ? (
                    <CategoryAvatar name={item.name} imagePath={categories.find((entry) => entry.name === item.name)?.image_path} fallbackWordImagePath={words.find((word) => word.category.trim().toLocaleLowerCase() === item.name.trim().toLocaleLowerCase() && word.imagePath)?.imagePath} colorClass={CATEGORY_COLOR_STYLES[itemColor]} />
                  ) : (
                    <ListFilter size={14} className={isSelected ? "text-white/90" : "text-slate-400"} aria-hidden="true" />
                  )}
                  <span className="truncate">{item.name}</span>
                </span>
                {isSelected && <Check size={15} aria-hidden="true" className="shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function VocabularyToolbar({
  search,
  category,
  categories,
  words,
  onSearchChange,
  onCategoryChange,
}: VocabularyToolbarProps) {
  return (
    <div className="min-w-0 flex-1 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Search */}
      <div className="relative w-full min-w-0 lg:max-w-md lg:flex-1">
        <Search
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          aria-label="Search vocabulary"
          value={search}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder="Search vocabulary..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-11 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
        />

        {search.length > 0 && (
          <button
            type="button"
            aria-label="Clear search"
            title="Clear search"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Category filters */}
      <div className="min-w-0 w-full lg:w-auto">
        <div
          role="group"
          aria-label="Filter vocabulary by category"
          className="flex min-w-0 items-center gap-2"
        >
          <FilterButton
            active={category === "All"}
            onClick={() => onCategoryChange("All")}
          >
            All
          </FilterButton>

          <CategoryDropdown
            category={category}
            categories={categories}
            words={words}
            onChange={(value) => onCategoryChange(value as CategoryFilter)}
          />
        </div>
      </div>
    </div>
  );
}
