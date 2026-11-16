import type { VocabularyCategoryColor } from "@/config/vocabulary";

export const CATEGORY_COLOR_STYLES: Record<VocabularyCategoryColor, string> = {
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

export const CATEGORY_DOT_STYLES: Record<VocabularyCategoryColor, string> = {
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  orange: "bg-orange-500",
  green: "bg-emerald-500",
  rose: "bg-rose-500",
  indigo: "bg-indigo-500",
  teal: "bg-teal-500",
  amber: "bg-amber-500",
  pink: "bg-pink-500",
  slate: "bg-slate-500",
};

export const CATEGORY_TRIGGER_STYLES: Record<VocabularyCategoryColor, string> = {
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
