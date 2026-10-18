import dayjs from 'dayjs';
import { downloadBlob } from './download';

export interface ExportColumn<T> {
  key: string;
  title: string;
  value: (row: T) => string | number | boolean | null | undefined;
  width?: number;
}

function serializeCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function escapeCsvCell(text: string): string {
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildCsvContent<T>(rows: T[], columns: ExportColumn<T>[]): string {
  const header = columns.map((column) => escapeCsvCell(column.title)).join(',');
  const lines = rows.map((row) =>
    columns.map((column) => escapeCsvCell(serializeCell(column.value(row)))).join(','),
  );
  return [header, ...lines].join('\r\n');
}

export function exportFilename(moduleLabel: string, extension: 'csv' | 'xlsx', date = new Date()): string {
  return `${moduleLabel}_${dayjs(date).format('YYYYMMDD-HHmm')}.${extension}`;
}

export function exportCsv<T>(rows: T[], columns: ExportColumn<T>[], moduleLabel: string): string {
  const content = String.fromCharCode(0xfeff) + buildCsvContent(rows, columns);
  const filename = exportFilename(moduleLabel, 'csv');
  downloadBlob(new Blob([content], { type: 'text/csv;charset=utf-8;' }), filename);
  return filename;
}

export async function buildXlsxBuffer<T>(rows: T[], columns: ExportColumn<T>[], sheetName = '数据'): Promise<ArrayBuffer> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'React Admin Template';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((column) => ({
    header: column.title,
    key: column.key,
    width: column.width ?? Math.max(12, column.title.length * 2 + 4),
  }));
  rows.forEach((row) => {
    const record: Record<string, string | number | boolean | null | undefined> = {};
    columns.forEach((column) => {
      record[column.key] = column.value(row);
    });
    sheet.addRow(record);
  });
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}

export async function exportXlsx<T>(rows: T[], columns: ExportColumn<T>[], moduleLabel: string, sheetName = '数据'): Promise<string> {
  const buffer = await buildXlsxBuffer(rows, columns, sheetName);
  const filename = exportFilename(moduleLabel, 'xlsx');
  downloadBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    filename,
  );
  return filename;
}
