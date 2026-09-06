import { matchSearch, paginate, uid, nowIso, sortByCreatedAtDesc, sortByField, filterByDateRange, applyQueryOptions } from './repo-utils';

describe('repo-utils', () => {
  describe('matchSearch', () => {
    const items = [
      { id: '1', name: 'Alice', email: 'alice@test.com' },
      { id: '2', name: 'Bob', email: 'bob@test.com' },
      { id: '3', name: 'Charlie', email: 'charlie@test.com' },
    ];

    it('returns all items when query is empty', () => {
      expect(matchSearch(items, '', ['name'])).toHaveLength(3);
    });
    it('filters by name field', () => {
      expect(matchSearch(items, 'ali', ['name'])).toHaveLength(1);
      expect(matchSearch(items, 'ali', ['name'])[0].name).toBe('Alice');
    });
    it('filters by email field', () => {
      expect(matchSearch(items, 'bob@test', ['email'])).toHaveLength(1);
    });
    it('is case insensitive', () => {
      expect(matchSearch(items, 'ALICE', ['name'])).toHaveLength(1);
    });
    it('searches across multiple fields', () => {
      expect(matchSearch(items, 'test', ['name', 'email'])).toHaveLength(3);
    });
    it('returns empty when no match', () => {
      expect(matchSearch(items, 'xyz', ['name', 'email'])).toHaveLength(0);
    });
  });

  describe('paginate', () => {
    const items = Array.from({ length: 25 }, (_, i) => ({ id: String(i + 1) }));

    it('returns first page with correct total', () => {
      const result = paginate(items, 1, 10);
      expect(result.items).toHaveLength(10);
      expect(result.total).toBe(25);
    });
    it('returns second page', () => {
      const result = paginate(items, 2, 10);
      expect(result.items).toHaveLength(10);
      expect(result.items[0].id).toBe('11');
    });
    it('returns last partial page', () => {
      const result = paginate(items, 3, 10);
      expect(result.items).toHaveLength(5);
    });
    it('handles page beyond range', () => {
      const result = paginate(items, 10, 10);
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(25);
    });
  });

  describe('uid', () => {
    it('generates unique ids with prefix', () => {
      const id1 = uid('c');
      const id2 = uid('c');
      expect(id1).not.toBe(id2);
      expect(id1.startsWith('c-')).toBe(true);
    });
  });

  describe('nowIso', () => {
    it('returns a valid ISO string', () => {
      const result = nowIso();
      expect(() => new Date(result)).not.toThrow();
    });
  });

  describe('sortByCreatedAtDesc', () => {
    it('sorts by createdAt descending', () => {
      const items = [
        { id: '1', createdAt: '2024-01-01T00:00:00Z' },
        { id: '2', createdAt: '2024-03-01T00:00:00Z' },
        { id: '3', createdAt: '2024-02-01T00:00:00Z' },
      ];
      const sorted = sortByCreatedAtDesc(items);
      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('3');
      expect(sorted[2].id).toBe('1');
    });
    it('does not mutate original array', () => {
      const items = [
        { id: '1', createdAt: '2024-01-01T00:00:00Z' },
        { id: '2', createdAt: '2024-03-01T00:00:00Z' },
      ];
      sortByCreatedAtDesc(items);
      expect(items[0].id).toBe('1');
    });
  });

  describe('sortByField', () => {
    const items = [
      { id: '1', name: 'Charlie', age: 30 },
      { id: '2', name: 'Alice', age: 25 },
      { id: '3', name: 'Bob', age: 35 },
    ];

    it('sorts by string field ascending', () => {
      const sorted = sortByField(items, 'name', 'asc');
      expect(sorted[0].name).toBe('Alice');
      expect(sorted[2].name).toBe('Charlie');
    });
    it('sorts by string field descending', () => {
      const sorted = sortByField(items, 'name', 'desc');
      expect(sorted[0].name).toBe('Charlie');
    });
    it('sorts by number field', () => {
      const sorted = sortByField(items, 'age', 'asc');
      expect(sorted[0].age).toBe(25);
      expect(sorted[2].age).toBe(35);
    });
  });

  describe('filterByDateRange', () => {
    const items = [
      { id: '1', createdAt: '2024-01-15T00:00:00Z' },
      { id: '2', createdAt: '2024-03-15T00:00:00Z' },
      { id: '3', createdAt: '2024-06-15T00:00:00Z' },
    ];

    it('filters by dateFrom', () => {
      expect(filterByDateRange(items, '2024-03-01')).toHaveLength(2);
    });
    it('filters by dateTo', () => {
      expect(filterByDateRange(items, undefined, '2024-03-31')).toHaveLength(2);
    });
    it('filters by range', () => {
      expect(filterByDateRange(items, '2024-02-01', '2024-04-30')).toHaveLength(1);
    });
    it('returns all when no range', () => {
      expect(filterByDateRange(items)).toHaveLength(3);
    });
  });

  describe('applyQueryOptions', () => {
    const items = [
      { id: '1', name: 'Alice', status: 'NEW', createdAt: '2024-01-01T00:00:00Z', tags: ['VIP'] },
      { id: '2', name: 'Bob', status: 'CONVERTED', createdAt: '2024-06-01T00:00:00Z', tags: [] },
      { id: '3', name: 'Charlie', status: 'NEW', createdAt: '2024-03-01T00:00:00Z', tags: ['VIP'] },
    ];

    it('applies search', () => {
      const result = applyQueryOptions(items as any, ['name'] as any, { search: 'ali' });
      expect(result).toHaveLength(1);
    });
    it('applies tag filter', () => {
      const result = applyQueryOptions(items as any, ['name'] as any, { filters: { tags: 'VIP' } });
      expect(result).toHaveLength(2);
    });
    it('applies status filter', () => {
      const result = applyQueryOptions(items as any, ['name'] as any, { filters: { status: 'NEW' } });
      expect(result).toHaveLength(2);
    });
    it('applies sort by field', () => {
      const result = applyQueryOptions(items as any, ['name'] as any, { sortBy: 'name', sortOrder: 'asc' });
      expect(result[0].name).toBe('Alice');
    });
  });
});