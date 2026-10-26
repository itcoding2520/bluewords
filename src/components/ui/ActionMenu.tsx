"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";

export type ActionMenuItem = {
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

export function ActionMenu({ label, actions, disabled = false }: { label: string; actions: ActionMenuItem[]; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, ready: false });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function placeMenu() {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;
      const triggerRect = trigger.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const gap = 6;
      const top = triggerRect.bottom + menuRect.height + gap <= window.innerHeight
        ? triggerRect.bottom + gap
        : Math.max(8, triggerRect.top - menuRect.height - gap);
      const left = Math.min(window.innerWidth - menuRect.width - 8, Math.max(8, triggerRect.right - menuRect.width));
      setPosition({ top, left, ready: true });
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    placeMenu();
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", placeMenu);
    window.addEventListener("scroll", placeMenu, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", placeMenu, true);
    };
  }, [open]);

  if (!actions.length) return null;

  return <div ref={rootRef} className="shared-action-menu-root">
    <button ref={triggerRef} type="button" aria-label={`Actions for ${label}`} aria-expanded={open} aria-haspopup="menu" disabled={disabled} onClick={() => { setPosition({ top: 0, left: 0, ready: false }); setOpen((value) => !value); }} className="shared-action-menu-trigger">
      <MoreHorizontal size={19} />
    </button>
    {open && typeof document !== "undefined" && createPortal(
      <div ref={menuRef} role="menu" aria-label={`${label} actions`} className="shared-action-menu" style={{ top: position.top, left: position.left, visibility: position.ready ? "visible" : "hidden" }}>
        {actions.map((action) => <button key={action.label} type="button" role="menuitem" disabled={action.disabled} onClick={() => { setOpen(false); action.onSelect(); }} className={action.destructive ? "is-destructive" : undefined}>
          {action.icon}<span>{action.label}</span>
        </button>)}
      </div>,
      document.body
    )}
  </div>;
}
