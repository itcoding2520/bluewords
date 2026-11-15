export function getPageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function getPageItems<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function getPageRange(total: number, page: number, pageSize: number) {
  return {
    first: total > 0 ? (page - 1) * pageSize + 1 : 0,
    last: Math.min(page * pageSize, total),
  };
}
