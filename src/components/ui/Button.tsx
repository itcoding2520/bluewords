
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white shadow-[0_5px_14px_rgb(37_99_235/0.22)] hover:bg-blue-700 hover:shadow-[0_7px_18px_rgb(37_99_235/0.28)]",

  secondary:
    "border border-sky-200 bg-white text-blue-700 shadow-sm hover:border-sky-300 hover:bg-sky-50",

  ghost:
    "text-blue-700 hover:bg-sky-50 hover:text-blue-900",
};

export function Button({
  variant = "primary",
  type = "button",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
