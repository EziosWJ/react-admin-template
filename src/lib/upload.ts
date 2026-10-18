import { env } from '../config/env';

export interface UploadValidationConfig {
  extensions: string[];
  maxSizeMb: number;
}

export interface SimulatedUploadResult {
  fileName: string;
  rowCount: number;
}

export function validateUploadFile(
  file: { name: string; size: number },
  config: UploadValidationConfig,
): { valid: true } | { valid: false; message: string } {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!config.extensions.includes(extension)) {
    return { valid: false, message: `仅支持 ${config.extensions.join('、')} 格式的文件。` };
  }
  if (file.size > config.maxSizeMb * 1024 * 1024) {
    return { valid: false, message: `文件大小不能超过 ${config.maxSizeMb} MB。` };
  }
  if (file.size === 0) {
    return { valid: false, message: '文件内容为空，请重新选择。' };
  }
  return { valid: true };
}

export function countCsvRows(content: string): number {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  return Math.max(0, lines.length - 1);
}

function readFileAsText(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('读取文件失败。'));
    reader.readAsText(file);
  });
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error('读取文件失败。'));
    reader.readAsArrayBuffer(file);
  });
}

export async function readDataRowCount(file: File): Promise<number> {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.csv')) {
    return countCsvRows(await readFileAsText(file));
  }
  if (lowerName.endsWith('.xlsx')) {
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await readFileAsArrayBuffer(file));
      const sheet = workbook.worksheets[0];
      return sheet ? Math.max(0, sheet.actualRowCount - 1) : 0;
    } catch {
      return 0;
    }
  }
  return 0;
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('上传已取消。'));
      return;
    }
    const timer = window.setTimeout(resolve, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new Error('上传已取消。'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export interface SimulateUploadOptions {
  onProgress?: (percent: number) => void;
  shouldFail?: boolean;
  signal?: AbortSignal;
}

export async function simulateUpload(
  file: File,
  options: SimulateUploadOptions = {},
): Promise<SimulatedUploadResult> {
  const duration = env.isTest ? 40 : 1200;
  const steps = 10;
  for (let step = 1; step <= steps; step += 1) {
    await wait(duration / steps, options.signal);
    if (options.shouldFail && step === 6) {
      throw new Error('模拟上传失败：已在演示中触发错误状态，请重试。');
    }
    options.onProgress?.(Math.round((step / steps) * 100));
  }
  const rowCount = await readDataRowCount(file);
  return { fileName: file.name, rowCount };
}
