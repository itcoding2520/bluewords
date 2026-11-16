import { jsonErrorResponse } from "@/lib/api/json-error-response";

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

export async function readRequestJsonOrResponse(
  request: Request,
  invalidMessage = "Invalid JSON body.",
) {
  const result = await readRequestJson(request);
  return result.ok
    ? result
    : { ok: false as const, response: jsonErrorResponse(invalidMessage, 400) };
}
