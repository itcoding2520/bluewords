export type RequestJsonResult =
  | { ok: true; value: unknown }
  | { ok: false };

export async function readRequestJson(request: Request): Promise<RequestJsonResult> {
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return { ok: false };
  }
}
