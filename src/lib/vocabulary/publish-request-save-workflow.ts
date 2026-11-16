type RequestRecord = { id: string; status: string };
type RequestError = { message: string; code?: string };
type RequestResult<T> = { data: T | null; error: RequestError | null };

export type PublishRequestSaveResult =
  | { status: "error"; source: "lookup" | "resubmit" | "create"; message: string; code?: string }
  | { status: "existing"; requestStatus: string }
  | { status: "resubmit_unavailable" }
  | { status: "resubmitted" }
  | { status: "created" };

export async function saveOrResubmitPublishRequest<T extends RequestRecord>({
  findExisting,
  resubmit,
  create,
}: {
  findExisting: () => PromiseLike<RequestResult<T>>;
  resubmit: (request: T) => PromiseLike<RequestResult<unknown>>;
  create: () => PromiseLike<{ error: RequestError | null }>;
}): Promise<PublishRequestSaveResult> {
  const existing = await findExisting();
  if (existing.error) {
    return { status: "error", source: "lookup", message: existing.error.message };
  }

  if (existing.data) {
    if (existing.data.status !== "rejected") {
      return { status: "existing", requestStatus: existing.data.status };
    }

    const updated = await resubmit(existing.data);
    if (updated.error) {
      return { status: "error", source: "resubmit", message: updated.error.message };
    }
    return updated.data ? { status: "resubmitted" } : { status: "resubmit_unavailable" };
  }

  const created = await create();
  if (created.error) {
    return {
      status: "error",
      source: "create",
      message: created.error.message,
      code: created.error.code,
    };
  }
  return { status: "created" };
}
