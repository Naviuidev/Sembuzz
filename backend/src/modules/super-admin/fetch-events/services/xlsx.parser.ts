import * as XLSX from 'xlsx';

/** First worksheet → rectangular matrix of string cells (for university roster spreadsheets). */
export function parseXlsxToMatrix(buffer: Buffer): string[][] {
  const wb = XLSX.read(buffer, { type: 'buffer', raw: false });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null | undefined)[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  }) as unknown[][];
  return rows.map((row) =>
    (row || []).map((cell) => {
      if (cell === null || cell === undefined) return '';
      return String(cell).trim();
    }),
  );
}
