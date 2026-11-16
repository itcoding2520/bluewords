export type ApiErrorPayload = {
  error?: string;
};

export async function readResponseJson<T extends ApiErrorPayload>(
  response: Response,
  fallbackError: string,
): Promise<T> {
  const payload = await response.json() as T;
  if (!response.ok) throw new Error(payload.error ?? fallbackError);
  return payload;
}
