import { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type CardProps = ComponentProps<"div">;

export function Card({
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/95 bg-white/90 shadow-[0_10px_30px_rgb(39_90_150/0.09)] backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}
