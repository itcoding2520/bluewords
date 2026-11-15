export const MAX_STANDARD_IMAGE_SIZE = 5 * 1024 * 1024;

const supportedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function validateStandardImage(file: Pick<File, "type" | "size">): string | null {
  if (!supportedImageTypes.has(file.type)) {
    return "Choose a JPEG, PNG, or WebP image.";
  }

  if (file.size > MAX_STANDARD_IMAGE_SIZE) {
    return "Image must be 5 MB or smaller.";
  }

  return null;
}

export function getStandardImageExtension(contentType: string): string {
  return contentType === "image/jpeg" ? "jpg" : contentType.slice("image/".length);
}
