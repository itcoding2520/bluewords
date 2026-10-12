import type {
  SelectHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

type SelectProps =
  SelectHTMLAttributes<HTMLSelectElement>;

export function Select({
  className,
  ...props
}: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          "w-full rounded-xl appearance-none border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition",
          "focus:border-blue-400 focus:ring-4 focus:ring-blue-50",
          className
        )}
        {...props}
      />
      <ChevronDown
        size={16}
        className="cursor-pointer absolute right-4 top-7 -translate-y-1/2 text-slate-500"
      />
    </div>

  );
}