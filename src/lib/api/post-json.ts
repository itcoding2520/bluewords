import { readResponseJson, type ApiErrorPayload } from "@/lib/api/read-response-json";

export async function postJson<T extends ApiErrorPayload>(
  url: string,
  body: unknown,
  fallbackError: string,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return readResponseJson<T>(response, fallbackError);
}
