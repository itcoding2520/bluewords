const CANDIDATE_TTL_MS = 2_000;
const HIDE_DELAY_MS = 220;

export function installGlobalActionTracking(onVisibilityChange: (visible: boolean) => void) {
  let active = false;
  let loading = false;
  let requestCount = 0;
  let candidateTimer: ReturnType<typeof setTimeout> | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  function clearTimers() {
    if (candidateTimer) clearTimeout(candidateTimer);
    if (hideTimer) clearTimeout(hideTimer);
    candidateTimer = null;
    hideTimer = null;
  }

  function finishAction() {
    if (requestCount > 0) return;

    hideTimer = setTimeout(() => {
      loading = false;
      active = false;
      onVisibilityChange(false);
      hideTimer = null;
    }, HIDE_DELAY_MS);
  }

  function beginAction() {
    active = true;
    if (candidateTimer) clearTimeout(candidateTimer);
    candidateTimer = setTimeout(() => {
      active = false;
      candidateTimer = null;
    }, CANDIDATE_TTL_MS);
  }

  const handleClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const button = target.closest(
      'button, input[type="button"], input[type="submit"], [role="button"]'
    );
    if (!button || button.hasAttribute("disabled")) return;

    if (loading) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    beginAction();
  };

  const handleSubmit = (event: SubmitEvent) => {
    // A submit button already started the action during its click event.
    // Enter-key submissions have no preceding button click, so start them here.
    if (loading) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (active) return;
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
    const trackRequest = active && isWriteRequest;
    if (trackRequest) {
      loading = true;
      requestCount += 1;
      if (candidateTimer) {
        clearTimeout(candidateTimer);
        candidateTimer = null;
      }
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      onVisibilityChange(true);
    }

    let request: Promise<Response>;
    try {
      request = originalFetch.apply(window, args);
    } catch (error) {
      if (trackRequest) {
        requestCount = Math.max(0, requestCount - 1);
        finishAction();
      }
      throw error;
    }

    return request.finally(() => {
      if (!trackRequest) return;
      requestCount = Math.max(0, requestCount - 1);
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
}
