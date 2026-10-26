"use client";

import { useEffect, useState, type ReactNode } from "react";

type MessageVariant = "success" | "warning" | "error";

const variantClasses: Record<MessageVariant, string> = {
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-800",
  error: "bg-red-50 text-red-700",
};

export function AutoDismissMessage({
  children,
  variant,
  className = "",
  id,
}: {
  children: ReactNode;
  variant: MessageVariant;
  className?: string;
  id?: string;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      id={id}
      role={variant === "error" || variant === "warning" ? "alert" : "status"}
      className={`rounded-xl p-3 text-sm ${variantClasses[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
