export function matchSearch<T>(items: T[], query: string, fields: (keyof T)[]): T[] {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter((item) =>
    fields.some((f) => {
      const v = item[f];
      return v != null && String(v).toLowerCase().includes(q);
    }),
  );
}

export function applyFilters<T extends Record<string, unknown>>(
  items: T[],
  filters: Record<string, unknown> | undefined,
): T[] {
  if (!filters) return items;
  return items.filter((item) =>
    Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === null || value === '') return true;
      return item[key] === value;
    }),
  );
}

export function paginate<T>(items: T[], page = 1, limit = 10): { items: T[]; total: number } {
  const total = items.length;
  const start = (page - 1) * limit;
  return { items: items.slice(start, start + limit), total };
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function sortByCreatedAtDesc<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type SortOrder = 'asc' | 'desc';

export function sortByField<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T,
  order: SortOrder = 'desc',
): T[] {
  const sorted = [...items].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av == null && bv == null) return 0;
    if (av == null) return order === 'asc' ? -1 : 1;
    if (bv == null) return order === 'asc' ? 1 : -1;
    if (typeof av === 'number' && typeof bv === 'number') return av - bv;
    return String(av).localeCompare(String(bv));
  });
  return order === 'asc' ? sorted : sorted.reverse();
}

export function filterByDateRange<T extends { createdAt: string }>(
  items: T[],
  dateFrom?: string,
  dateTo?: string,
): T[] {
  if (!dateFrom && !dateTo) return items;
  return items.filter((item) => {
    const d = item.createdAt;
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo + 'T23:59:59.999Z') return false;
    return true;
  });
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  filters?: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: SortOrder;
  dateFrom?: string;
  dateTo?: string;
}

export function applyQueryOptions<T extends Record<string, unknown>>(
  items: T[],
  searchFields: (keyof T)[],
  opts: QueryOptions,
): T[] {
  let result = matchSearch(items, opts.search || '', searchFields);
  const filters = opts.filters;
  result = result.filter((item) => {
    if (!filters) return true;
    return Object.entries(filters).every(([k, v]) => {
      if (v === undefined || v === null || v === '') return true;
      if (k === 'tags') return Array.isArray((item as Record<string, unknown>).tags) && ((item as Record<string, unknown>).tags as string[]).includes(v as string);
      return item[k as keyof T] === v;
    });
  });
  if (opts.dateFrom || opts.dateTo) {
    result = result.filter((item) => {
      const d = (item as Record<string, unknown>).createdAt as string;
      if (!d) return true;
      if (opts.dateFrom && d < opts.dateFrom) return false;
      if (opts.dateTo && d > opts.dateTo + 'T23:59:59.999Z') return false;
      return true;
    });
  }
  if (opts.sortBy) {
    result = [...result].sort((a, b) => {
      const av = a[opts.sortBy as keyof T];
      const bv = b[opts.sortBy as keyof T];
      if (av == null && bv == null) return 0;
      if (av == null) return opts.sortOrder === 'asc' ? -1 : 1;
      if (bv == null) return opts.sortOrder === 'asc' ? 1 : -1;
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      return String(av).localeCompare(String(bv));
    });
    if (opts.sortOrder !== 'asc') result = result.reverse();
  }
  return result;
}