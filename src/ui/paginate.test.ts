import { describe, it, expect } from 'vitest';
import { paginate } from './paginate';

const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

describe('paginate', () => {
  it('returns the first full page', () => {
    expect(paginate(items, 1, 10)).toEqual({ items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], page: 1, pageCount: 2 });
  });

  it('returns the last partial page', () => {
    expect(paginate(items, 2, 10)).toEqual({ items: [11, 12], page: 2, pageCount: 2 });
  });

  it('clamps a page above the range to the last page', () => {
    expect(paginate(items, 99, 10).page).toBe(2);
    expect(paginate(items, 99, 10).items).toEqual([11, 12]);
  });

  it('clamps a zero or negative page to the first page', () => {
    expect(paginate(items, 0, 10).page).toBe(1);
    expect(paginate(items, -5, 10).page).toBe(1);
  });

  it('treats an empty list as a single empty page', () => {
    expect(paginate([], 1, 10)).toEqual({ items: [], page: 1, pageCount: 1 });
  });
});
