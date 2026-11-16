export function* chunkArray<T>(values: readonly T[], chunkSize: number): Generator<T[]> {
  if (!Number.isInteger(chunkSize) || chunkSize < 1) {
    throw new RangeError("Chunk size must be a positive integer.");
  }

  for (let start = 0; start < values.length; start += chunkSize) {
    yield values.slice(start, start + chunkSize);
  }
}
