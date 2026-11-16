import { useCallback, type Dispatch, type SetStateAction } from "react";
import { updateStateField } from "@/lib/state-action";

export function useStateField<TState, TKey extends keyof TState>(
  setState: Dispatch<SetStateAction<TState>>,
  key: TKey,
): Dispatch<SetStateAction<TState[TKey]>> {
  return useCallback(
    (action) => updateStateField(setState, key, action),
    [key, setState],
  );
}
