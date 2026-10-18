import { HttpResponse, delay } from 'msw';
import { env } from '../../config/env';
import type { SortOrder } from '../../types/api';
import { isDateString } from '../../utils/format';

const RESPONSE_DELAY_MS = env.isTest ? 0 : 160;

export async function simulateLatency(): Promise<void> {
  if (RESPONSE_DELAY_MS > 0) {
    await delay(RESPONSE_DELAY_MS);
  }
}

export function errorResponse(
  status: number,
  message: string,
  code?: string,
  field?: string,
) {
  return HttpResponse.json({ message, code, field }, { status });
}

export interface ParsedListRequest {
  page: number;
  pageSize: number;
  keyword: string;
  sortBy?: string;
  sortOrder: SortOrder;
  params: URLSearchParams;
}

export function parseListRequest(request: Request): ParsedListRequest {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const requestedPageSize = Number(url.searchParams.get('pageSize')) || 10;
  const pageSize = Math.min(Math.max(1, requestedPageSize), 10_000);
  const keyword = (url.searchParams.get('keyword') ?? url.searchParams.get('q') ?? '').trim().toLowerCase();
  const sortBy = url.searchParams.get('sortBy') ?? undefined;
  const sortOrder: SortOrder = url.searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
  return { page, pageSize, keyword, sortBy, sortOrder, params: url.searchParams };
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
  };
}

function compareValues(left: unknown, right: unknown): number {
  if (left === null || left === undefined) return right === null || right === undefined ? 0 : 1;
  if (right === null || right === undefined) return -1;
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left).localeCompare(String(right), 'zh-CN');
}

export function sortEntities<T extends object>(
  items: T[],
  sortBy: string | undefined,
  sortOrder: SortOrder,
  allowed: readonly string[],
  fallback: (left: T, right: T) => number,
): T[] {
  const sorted = [...items];
  if (!sortBy || !allowed.includes(sortBy)) {
    sorted.sort(fallback);
    return sorted;
  }
  sorted.sort((left, right) => {
    const result = compareValues(
      (left as Record<string, unknown>)[sortBy],
      (right as Record<string, unknown>)[sortBy],
    );
    return sortOrder === 'asc' ? result : -result;
  });
  return sorted;
}

export function containsKeyword(values: (string | null | undefined)[], keyword: string): boolean {
  if (!keyword) return true;
  return values.some((value) => (value ?? '').toLowerCase().includes(keyword));
}

export function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function numberValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }
  return Number.NaN;
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isPhone(value: string): boolean {
  return /^(1[3-9]\d{9}|0\d{2,3}-?\d{7,8})$/.test(value);
}

export function isCode(value: string): boolean {
  return /^[A-Za-z0-9-]{3,24}$/.test(value);
}

export function isDate(value: string): boolean {
  return isDateString(value);
}

export function inDateRange(value: string, from?: string | null, to?: string | null): boolean {
  const date = value.slice(0, 10);
  if (from && isDateString(from) && date < from) return false;
  if (to && isDateString(to) && date > to) return false;
  return true;
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function oneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}
