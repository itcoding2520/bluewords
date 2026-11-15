import { Select } from "@/components/ui/Select";
import type { VocabularyCategoryColor } from "@/lib/supabase/categories";

export const vocabularyCategoryColorOptions: Array<{
  value: VocabularyCategoryColor;
  label: string;
  className: string;
}> = [
  { value: "blue", label: "Blue", className: "bg-blue-500" },
  { value: "violet", label: "Violet", className: "bg-[#bf00ff]" },
  { value: "orange", label: "Orange", className: "bg-[#ff990a]" },
  { value: "green", label: "Green", className: "bg-emerald-500" },
  { value: "rose", label: "Rose", className: "bg-rose-500" },
  { value: "indigo", label: "Indigo", className: "bg-indigo-500" },
  { value: "teal", label: "Teal", className: "bg-teal-500" },
  { value: "amber", label: "Amber", className: "bg-amber-500" },
  { value: "pink", label: "Pink", className: "bg-pink-500" },
  { value: "slate", label: "Slate", className: "bg-slate-500" },
];

interface VocabularyCategoryColorSelectProps {
  ariaLabel: string;
  value: VocabularyCategoryColor;
  onChange: (color: VocabularyCategoryColor) => void;
}

export function VocabularyCategoryColorSelect({
  ariaLabel,
  value,
  onChange,
}: VocabularyCategoryColorSelectProps) {
  return (
    <Select
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value as VocabularyCategoryColor)}
    >
      {vocabularyCategoryColorOptions.map((color) => (
        <option key={color.value} value={color.value}>
          {color.label}
        </option>
      ))}
    </Select>
  );
}
