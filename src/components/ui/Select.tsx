import type {
  SelectHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  containerClassName?: string;
};

export function Select({
  className,
  containerClassName,
  ...props
}: SelectProps) {
  return (
    <div className={cn("relative", containerClassName)}>
      <select
        className={cn(
          "h-11 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-0 pl-4 pr-10 text-base text-slate-900 outline-none transition sm:text-sm",
          "focus:border-blue-400 focus:ring-4 focus:ring-blue-50",
          className
        )}
        {...props}
      />
      <ChevronDown
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}
