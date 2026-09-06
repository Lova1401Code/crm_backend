export function toCsv(rows: Record<string, unknown>[], columns: { key: string; label: string }[]): string {
  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const s = Array.isArray(val) ? val.join('; ') : String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes(';')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const header = columns.map((c) => escape(c.label)).join(',');
  const body = rows
    .map((row) => columns.map((c) => escape(row[c.key])).join(','))
    .join('\n');

  return `${header}\n${body}`;
}

export function csvResponse(filename: string, csv: string): { content: string; filename: string } {
  return { content: csv, filename };
}