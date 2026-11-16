export function getFirstImageByKey(
  entries: Iterable<{ key: string; imagePath: string | null | undefined }>,
): Map<string, string> {
  const images = new Map<string, string>();
  for (const { key, imagePath } of entries) {
    if (imagePath && !images.has(key)) images.set(key, imagePath);
  }
  return images;
}
