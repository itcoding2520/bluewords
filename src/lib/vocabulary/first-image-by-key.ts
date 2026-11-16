export function getFirstImageByKey<T>(
  entries: Iterable<T>,
  getKey: (entry: T) => string,
  getImagePath: (entry: T) => string | null | undefined,
): Map<string, string> {
  const images = new Map<string, string>();
  for (const entry of entries) {
    const key = getKey(entry);
    const imagePath = getImagePath(entry);
    if (imagePath && !images.has(key)) images.set(key, imagePath);
  }
  return images;
}
