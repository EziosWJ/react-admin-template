import { describe, expect, it } from 'vitest';
import {
  buildCsvContent,
  buildXlsxBuffer,
  exportFilename,
  type ExportColumn,
} from '../../src/utils/export';

interface Row {
  name: string;
  amount: number;
  note: string;
}

const columns: ExportColumn<Row>[] = [
  { key: 'name', title: '名称', value: (row) => row.name },
  { key: 'amount', title: '金额', value: (row) => row.amount },
  { key: 'note', title: '备注', value: (row) => row.note },
];

const rows: Row[] = [
  { name: '星云科技', amount: 1234.5, note: '含逗号,与"引号"' },
  { name: '蓝海制造', amount: 2000, note: '多行\n备注' },
];

describe('CSV/XLSX export utilities', () => {
  it('builds CSV with headers, Chinese content and escaped separators', () => {
    const csv = buildCsvContent(rows, columns);
    const lines = csv.split('\r\n');

    expect(lines[0]).toBe('名称,金额,备注');
    expect(csv).toContain('星云科技');
    expect(csv).toContain('"含逗号,与""引号"""');
    expect(csv).toContain('"多行\n备注"');
  });

  it('creates a filename with module label and timestamp', () => {
    const filename = exportFilename('客户列表', 'csv', new Date(2026, 9, 18, 15, 30));
    expect(filename).toBe('客户列表_20261018-1530.csv');
  });

  it('builds a readable XLSX workbook with headers and rows', async () => {
    const buffer = await buildXlsxBuffer(rows, columns, '客户数据');
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.getWorksheet('客户数据');
    expect(sheet).toBeDefined();
    expect(sheet!.getCell('A1').value).toBe('名称');
    expect(sheet!.getCell('A2').value).toBe('星云科技');
    expect(sheet!.getCell('B2').value).toBe(1234.5);
    expect(sheet!.getCell('C3').value).toBe('多行\n备注');
    expect(sheet!.rowCount).toBe(3);
  });
});
