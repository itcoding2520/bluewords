"use client";

import { useCallback, useRef, useState } from "react";
import { getWordSearchSelectionPath } from "@/lib/word-search.mjs";

export type CellPosition = { row: number; column: number };
type ActiveDrag = { pointerId: number; start: CellPosition };

function getCellPosition(element: Element | null): CellPosition | null {
  const cell = element?.closest<HTMLElement>("[data-cell-row][data-cell-column]");
  if (!cell) return null;
  const row = Number(cell.dataset.cellRow);
  const column = Number(cell.dataset.cellColumn);
  return Number.isInteger(row) && Number.isInteger(column) ? { row, column } : null;
}

export function useWordSearchSelection({
  enabled,
  onSelectionComplete,
}: {
  enabled: boolean;
  onSelectionComplete: (selection: CellPosition[]) => void;
}) {
  const [selectedCells, setSelectedCells] = useState<CellPosition[]>([]);
  const activeDragRef = useRef<ActiveDrag | null>(null);

  const clearSelection = useCallback(() => {
    activeDragRef.current = null;
    setSelectedCells([]);
  }, []);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled || event.button !== 0) return;
    const start = getCellPosition(event.target as Element);
    if (!start) return;
    event.preventDefault();
    activeDragRef.current = { pointerId: event.pointerId, start };
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedCells([start]);
  }, [enabled]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drag = activeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const end = getCellPosition(document.elementFromPoint(event.clientX, event.clientY));
    if (!end) return;
    setSelectedCells(getWordSearchSelectionPath(drag.start, end) ?? [drag.start]);
  }, []);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drag = activeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const end = getCellPosition(document.elementFromPoint(event.clientX, event.clientY));
    const selection = end ? getWordSearchSelectionPath(drag.start, end) : null;
    activeDragRef.current = null;
    onSelectionComplete(selection ?? []);
  }, [onSelectionComplete]);

  const handlePointerCancel = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (activeDragRef.current?.pointerId !== event.pointerId) return;
    clearSelection();
  }, [clearSelection]);

  return { selectedCells, clearSelection, handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel };
}
