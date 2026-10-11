import {
  forwardRef,
  type InputHTMLAttributes,
} from "react";

import { cn } from "@/lib/cn";

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      className,
      error = false,
      ...props
    },
    ref
  ) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400",
          "focus:ring-4",
          error
            ? "border-red-300 focus:border-red-400 focus:ring-red-50"
            : "border-slate-200 focus:border-blue-400 focus:ring-blue-50",
          className
        )}
        {...props}
      />
    );
  }
);