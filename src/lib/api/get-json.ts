import { readResponseJson, type ApiErrorPayload } from "@/lib/api/read-response-json";

export async function getJson<T extends ApiErrorPayload>(
  url: string,
  fallbackError: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, options);
  return readResponseJson<T>(response, fallbackError);
}
