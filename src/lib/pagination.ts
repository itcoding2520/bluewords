export function getPageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function getPreviousPage(page: number): number {
  return Math.max(1, page - 1);
}

export function getNextPage(page: number, pageCount: number): number {
  return Math.min(pageCount, page + 1);
}

export function getPageItems<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function getInclusivePageRange(page: number, pageSize: number): { from: number; to: number } {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

export function getPageRange(total: number, page: number, pageSize: number) {
  return {
    first: total > 0 ? (page - 1) * pageSize + 1 : 0,
    last: Math.min(page * pageSize, total),
  };
}

export function getPageMetadata(total: number, page: number, pageSize: number) {
  const pageCount = getPageCount(total, pageSize);
  const currentPage = Math.min(page, pageCount);
  const range = getPageRange(total, currentPage, pageSize);
  return { pageCount, currentPage, first: range.first, last: range.last };
}
