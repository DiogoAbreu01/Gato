// Funções puras para cálculos de planilhas e exportação segura.
export type GridData = { columns: string[]; rows: string[][]; view?: 'table' | 'board' };

export function colName(index: number): string {
  if (!Number.isInteger(index) || index < 0 || index >= 30) return '#REF';
  let result = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    result = String.fromCharCode(65 + ((n - 1) % 26)) + result;
  }
  return result;
}

export function cellCoords(ref: string): { row: number; col: number } | null {
  const m = /^([A-Z]{1,2})([1-9][0-9]{0,2})$/i.exec(ref);
  if (!m) return null;
  let col = 0;
  for (const c of m[1].toUpperCase()) col = col * 26 + c.charCodeAt(0) - 64;
  col -= 1;
  const row = Number(m[2]) - 1;
  return col >= 0 && col < 30 && row >= 0 && row < 250 ? { row, col } : null;
}

function asNumeric(text: string): number {
  const number = Number(text.trim().replace(',', '.'));
  return Number.isFinite(number) ? number : 0;
}
const cleanNumber = (n: number) => Number.isFinite(n) ? String(Math.round(n * 1e8) / 1e8) : '#NUM';

export function calculateCell(rows: string[][], row: number, col: number, visiting = new Set<string>()): string {
  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= rows.length || col >= (rows[row]?.length ?? 0)) return '#REF';
  const raw = rows[row][col] ?? '';
  if (!raw.startsWith('=')) return raw;
  const token = row + ':' + col;
  if (visiting.has(token)) return '#CYCLE';
  const seen = new Set(visiting);
  seen.add(token);

  function value(ref: string): { number: number; error?: string } {
    if (/^-?[0-9]+(?:[,.][0-9]+)?$/.test(ref)) return { number: asNumeric(ref) };
    const coordinates = cellCoords(ref);
    if (!coordinates) return { number: 0, error: '#REF' };
    const result = calculateCell(rows, coordinates.row, coordinates.col, seen);
    if (result.startsWith('#')) return { number: 0, error: result };
    return { number: asNumeric(result) };
  }

  const sum = /^=SUM\(([A-Z]{1,2}[1-9][0-9]{0,2}):([A-Z]{1,2}[1-9][0-9]{0,2})\)$/i.exec(raw);
  if (sum) {
    const start = cellCoords(sum[1]);
    const end = cellCoords(sum[2]);
    if (!start || !end || start.col > end.col || start.row > end.row) return '#REF';
    let total = 0;
    for (let r = start.row; r <= end.row; r++) {
      for (let c = start.col; c <= end.col; c++) {
        const n = value(colName(c) + (r + 1));
        if (n.error) return n.error;
        total += n.number;
      }
    }
    return cleanNumber(total);
  }

  const operation = /^=\s*([A-Z]{1,2}[1-9][0-9]{0,2}|-?[0-9]+(?:[,.][0-9]+)?)\s*([+*/-])\s*([A-Z]{1,2}[1-9][0-9]{0,2}|-?[0-9]+(?:[,.][0-9]+)?)\s*$/i.exec(raw);
  if (!operation) return '#FÓRMULA';
  const a = value(operation[1]);
  const b = value(operation[3]);
  if (a.error) return a.error;
  if (b.error) return b.error;
  if (operation[2] === '/' && b.number === 0) return '#DIV/0';
  const total = operation[2] === '+' ? a.number + b.number : operation[2] === '-' ? a.number - b.number : operation[2] === '*' ? a.number * b.number : a.number / b.number;
  return cleanNumber(total);
}

// Protege Excel/LibreOffice contra CSV Formula Injection, inclusive em cabeçalhos.
// Fórmulas do próprio editor são exportadas como VALORES calculados, não como scripts.
export function toCSV(data: GridData): string {
  return [data.columns, ...data.rows].map((row, r) =>
    row.map((cell, c) => {
      const computed = r > 0 && cell.startsWith('=') ? calculateCell(data.rows, r - 1, c) : cell;
      // Fórmulas desconhecidas permanecem como texto literal, nunca como código de planilha.
      const value = computed === '#FÓRMULA' ? cell : computed;
      const formulaLike = /^[\s]*[=+@-]/.test(value) && !/^-\d+(?:[,.]\d+)?$/.test(value.trim());
      const safe = formulaLike ? "'" + value : value;
      return '"' + safe.replaceAll('"', '""') + '"';
    }).join(';')
  ).join('\r\n');
}
