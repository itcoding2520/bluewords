import { Search } from "lucide-react";

import { Select } from "@/components/ui/Select";

type SituationFiltersProps = {
  search: string;
  difficulty: string;
  onSearchChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
};

export function SituationFilters({ search, difficulty, onSearchChange, onDifficultyChange }: SituationFiltersProps) {
  return (
    <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_13rem]">
      <label className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
        <input
          aria-label="Search situations"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-10 w-full rounded-xl border border-sky-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          placeholder="Search situations…"
        />
      </label>
      <Select aria-label="Filter lessons by difficulty" className="!h-10 !rounded-xl" value={difficulty} onChange={(event) => onDifficultyChange(event.target.value)}>
        <option value="all">All levels</option>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </Select>
    </div>
  );
}
