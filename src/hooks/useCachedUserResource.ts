import { useEffect, useState } from "react";

export type CachedUserResourceState<T> =
  | { userId: string; status: "loading" }
  | { userId: string; status: "error" }
  | { userId: string; status: "loaded"; data: T };

export function useCachedUserResource<T>(
  userId: string,
  getCached: (userId: string) => T | undefined,
  load: (userId: string) => Promise<T>,
  errorMessage: string,
) {
  const [state, setState] = useState<CachedUserResourceState<T>>(() => {
    const cached = getCached(userId);
    return cached
      ? { userId, status: "loaded", data: cached }
      : { userId, status: "loading" };
  });

  useEffect(() => {
    let active = true;
    void load(userId)
      .then((data) => {
        if (active) setState({ userId, status: "loaded", data });
      })
      .catch((error) => {
        console.error(errorMessage, error);
        if (active) setState({ userId, status: "error" });
      });
    return () => { active = false; };
  }, [errorMessage, load, userId]);

  return state.userId === userId ? state : null;
}
