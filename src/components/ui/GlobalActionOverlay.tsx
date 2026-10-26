"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";

const CANDIDATE_TTL_MS = 2_000;
const HIDE_DELAY_MS = 220;

export function GlobalActionOverlay() {
  const [visible, setVisible] = useState(false);
  const activeRef = useRef(false);
  const loadingRef = useRef(false);
  const requestCountRef = useRef(0);
  const candidateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (candidateTimerRef.current) clearTimeout(candidateTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    candidateTimerRef.current = null;
    hideTimerRef.current = null;
  }, []);

  const finishAction = useCallback(() => {
    if (requestCountRef.current > 0) return;

    hideTimerRef.current = setTimeout(() => {
      loadingRef.current = false;
      activeRef.current = false;
      setVisible(false);
      hideTimerRef.current = null;
    }, HIDE_DELAY_MS);
  }, []);

  const beginAction = useCallback(() => {
    activeRef.current = true;
    if (candidateTimerRef.current) clearTimeout(candidateTimerRef.current);
    candidateTimerRef.current = setTimeout(() => {
      activeRef.current = false;
      candidateTimerRef.current = null;
    }, CANDIDATE_TTL_MS);
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest(
        'button, input[type="button"], input[type="submit"], [role="button"]'
      );
      if (!button || button.hasAttribute("disabled")) return;

      if (loadingRef.current) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      beginAction();
    };

    const handleSubmit = (event: SubmitEvent) => {
      // A submit button already started the action during its click event.
      // Enter-key submissions have no preceding button click, so start them here.
      if (loadingRef.current) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (activeRef.current) return;
      beginAction();
    };

    const originalFetch = window.fetch;
    const trackedFetch: typeof window.fetch = (...args) => {
      const [input, init] = args;
      const method = (
        init?.method ?? (input instanceof Request ? input.method : "GET")
      ).toUpperCase();
      const url = input instanceof Request ? input.url : String(input);
      const isWriteRequest =
        ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
        !url.includes("/auth/v1/");
      const trackRequest = activeRef.current && isWriteRequest;
      if (trackRequest) {
        loadingRef.current = true;
        requestCountRef.current += 1;
        if (candidateTimerRef.current) {
          clearTimeout(candidateTimerRef.current);
          candidateTimerRef.current = null;
        }
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
        setVisible(true);
      }

      let request: Promise<Response>;
      try {
        request = originalFetch.apply(window, args);
      } catch (error) {
        if (trackRequest) {
          requestCountRef.current = Math.max(0, requestCountRef.current - 1);
          finishAction();
        }
        throw error;
      }

      return request.finally(() => {
        if (!trackRequest) return;
        requestCountRef.current = Math.max(0, requestCountRef.current - 1);
        finishAction();
      });
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);
    window.fetch = trackedFetch;

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      if (window.fetch === trackedFetch) window.fetch = originalFetch;
      clearTimers();
    };
  }, [beginAction, clearTimers, finishAction]);

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
