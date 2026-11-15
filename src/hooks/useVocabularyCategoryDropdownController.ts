import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

export interface VocabularyCategoryDropdownOption {
  id: string;
  name: string;
  value: string;
  color?: string | null;
}

export function useVocabularyCategoryDropdownController({
  category,
  options,
  onChange,
}: {
  category: string;
  options: VocabularyCategoryDropdownOption[];
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => optionRefs.current[activeIndex]?.focus());
  }, [isOpen, activeIndex]);

  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, [isOpen]);

  function openMenu() {
    if (options.length === 0) return;
    const selectedIndex = options.findIndex((item) => item.value === category);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  }

  function chooseCategory(name: string) {
    onChange(name);
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (isOpen) {
        const delta = event.key === "ArrowDown" ? 1 : -1;
        const nextIndex = (activeIndex + delta + options.length) % options.length;
        setActiveIndex(nextIndex);
        optionRefs.current[nextIndex]?.focus();
      } else {
        openMenu();
      }
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (isOpen) setIsOpen(false);
      else openMenu();
    } else if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
    }
  }

  function handleOptionKeyDown(
    event: ReactKeyboardEvent<HTMLDivElement>,
    index: number
  ) {
    let nextIndex = index;

    if (event.key === "ArrowDown") nextIndex = (index + 1) % options.length;
    else if (event.key === "ArrowUp") nextIndex = (index - 1 + options.length) % options.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = options.length - 1;
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      chooseCategory(options[index].value);
      return;
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    } else {
      return;
    }

    event.preventDefault();
    setActiveIndex(nextIndex);
    optionRefs.current[nextIndex]?.focus();
  }

  return {
    isOpen,
    setIsOpen,
    activeIndex,
    setActiveIndex,
    rootRef,
    triggerRef,
    optionRefs,
    openMenu,
    chooseCategory,
    handleTriggerKeyDown,
    handleOptionKeyDown,
  };
}
