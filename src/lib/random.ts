/** Return a Fisher–Yates shuffled copy without changing the input array. */
export function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

/** Shuffle a copy of the items and keep at most `count` entries. */
export function shuffleAndTake<T>(items: T[], count: number): T[] {
  return shuffle(items).slice(0, count);
}

/** Return a shuffled round only when the source contains enough entries. */
export function shuffleRoundIfAvailable<T>(items: T[], count: number): T[] | null {
  if (items.length < count) return null;
  return shuffleAndTake(items, count);
}

/** Pick up to `count` unique entries from a copied pool. */
export function sampleRandom<T>(items: T[], count: number): T[] {
  const pool = [...items];
  const sampleSize = Math.min(Math.max(0, count), pool.length);
  for (let index = 0; index < sampleSize; index += 1) {
    const target = index + Math.floor(Math.random() * (pool.length - index));
    [pool[index], pool[target]] = [pool[target], pool[index]];
  }
  return pool.slice(0, sampleSize);
}

/** Reservoir-sample entries matching a predicate without copying the source. */
export function sampleRandomMatching<T>(items: T[], count: number, matches: (item: T) => boolean): T[] {
  const sample: T[] = [];
  let matched = 0;
  for (const item of items) {
    if (!matches(item)) continue;
    matched += 1;
    if (sample.length < count) {
      sample.push(item);
      continue;
    }
    const replacementIndex = Math.floor(Math.random() * matched);
    if (replacementIndex < count) sample[replacementIndex] = item;
  }
  return sample;
}
