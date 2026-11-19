import type { PaginationMeta } from './sendResponse';

/** Escapes user input before it is used inside a RegExp (prevents ReDoS / regex injection). */
export const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export interface PageQuery {
  page: number;
  limit: number;
  sortBy: string;
  order: 'asc' | 'desc';
}

export const toPagination = ({ page, limit }: Pick<PageQuery, 'page' | 'limit'>) => ({
  skip: (page - 1) * limit,
  limit,
});

export const buildMeta = (page: number, limit: number, total: number): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

/** Builds a `{ field: { $gte, $lte } }` filter from optional ISO date strings (inclusive day range). */
export const dateRange = (from?: Date, to?: Date) => {
  if (!from && !to) return undefined;
  const range: { $gte?: Date; $lte?: Date } = {};
  if (from) range.$gte = startOfDay(from);
  if (to) range.$lte = endOfDay(to);
  return range;
};

export const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export const endOfDay = (date: Date) => {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
};
