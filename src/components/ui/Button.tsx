import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-slate-950 text-white hover:bg-slate-800",

  secondary:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",

  ghost:
    "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}