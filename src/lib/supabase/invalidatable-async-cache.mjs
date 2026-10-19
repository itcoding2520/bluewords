/**
 * Creates a promise cache that ignores results from requests invalidated in flight.
 *
 * @returns {{ get: <T>(key: string, load: () => Promise<T>) => Promise<T>, invalidate: (key?: string) => void }}
 */
export function createInvalidatableAsyncCache() {
  const values = new Map();
  const requests = new Map();
  const keyGenerations = new Map();
  let allGeneration = 0;

  function generationFor(key) {
    return `${allGeneration}:${keyGenerations.get(key) ?? 0}`;
  }

  async function get(key, load) {
    if (values.has(key)) return values.get(key);

    const pending = requests.get(key);
    if (pending) return pending;

    const generation = generationFor(key);
    const request = Promise.resolve().then(load);
    requests.set(key, request);

    try {
      const value = await request;
      if (generation !== generationFor(key)) return get(key, load);

      if (requests.get(key) === request) values.set(key, value);
      return value;
    } catch (error) {
      if (generation !== generationFor(key)) return get(key, load);
      throw error;
    } finally {
      if (requests.get(key) === request) requests.delete(key);
    }
  }

  function invalidate(key) {
    if (key !== undefined) {
      keyGenerations.set(key, (keyGenerations.get(key) ?? 0) + 1);
      values.delete(key);
      requests.delete(key);
      return;
    }

    allGeneration += 1;
    values.clear();
    requests.clear();
  }

  return { get, invalidate };
}
