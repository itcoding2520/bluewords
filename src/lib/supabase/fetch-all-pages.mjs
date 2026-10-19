/**
 * Fetches every row from a range-based paginated query.
 *
 * @template T
 * @param {(from: number, to: number) => Promise<{ data: T[] | null, error: unknown }>} fetchPage
 * @param {number} [pageSize]
 * @returns {Promise<T[]>}
 */
export async function fetchAllPages(fetchPage, pageSize = 1000) {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError("Page size must be a positive integer.");
  }

  const rows = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) throw error;

    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}
