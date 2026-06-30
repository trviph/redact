export interface Page<T> {
  items: T[];
  page: number;
  pageCount: number;
}

/**
 * Slices `items` into the requested page. `page` is clamped into the valid
 * range; `pageCount` is always at least 1 (an empty list is one empty page).
 */
export function paginate<T>(items: T[], page: number, pageSize: number): Page<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const clamped = Math.min(Math.max(1, Math.floor(page)), pageCount);
  const start = (clamped - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page: clamped, pageCount };
}
