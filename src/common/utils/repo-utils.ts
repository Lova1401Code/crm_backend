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