import { useCallback, useState, type Dispatch, type SetStateAction } from "react";

type FeedbackMessages = {
  error: string;
  notice: string;
};

function resolveState<T>(value: SetStateAction<T>, current: T): T {
  return typeof value === "function" ? (value as (previous: T) => T)(current) : value;
}

export function useFeedbackMessages() {
  const [feedback, setFeedback] = useState<FeedbackMessages>({ error: "", notice: "" });
  const setError = useCallback<Dispatch<SetStateAction<string>>>((value) => setFeedback((current) => ({
    ...current,
    error: resolveState(value, current.error),
  })), []);
  const setNotice = useCallback<Dispatch<SetStateAction<string>>>((value) => setFeedback((current) => ({
    ...current,
    notice: resolveState(value, current.notice),
  })), []);

  return { ...feedback, setError, setNotice };
}
