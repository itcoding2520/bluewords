"use client";

import { LoaderCircle } from "lucide-react";

import { useGlobalActionTracking } from "@/hooks/useGlobalActionTracking";

export function GlobalActionOverlay() {
  const visible = useGlobalActionTracking();

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/20 backdrop-blur-[1px]"
      role="status"
      aria-live="polite"
      aria-label="Đang xử lý"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/95 px-5 py-4 text-sm font-semibold text-slate-800 shadow-xl">
        <LoaderCircle className="h-5 w-5 animate-spin text-blue-600" aria-hidden="true" />
        <span>Đang xử lý...</span>
      </div>
    </div>
  );
}
