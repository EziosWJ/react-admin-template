import { createMockDatabase, type MockDatabase } from './data';
import type { Order } from '../types/models';

let database: MockDatabase = createMockDatabase();

export function getMockDatabase(): MockDatabase {
  return database;
}

export function resetMockDatabase(): void {
  database = createMockDatabase();
}

export function createEntityId(prefix: string, items: { id: string }[], width = 3): string {
  const max = items.reduce((current, item) => {
    const numeric = Number(item.id.split('-').pop());
    return Number.isFinite(numeric) ? Math.max(current, numeric) : current;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(width, '0')}`;
}

export function createOrderNumber(orders: Order[]): string {
  const year = new Date().getFullYear();
  const prefix = `SO-${year}-`;
  const max = orders.reduce((current, order) => {
    if (!order.orderNo.startsWith(prefix)) return current;
    const numeric = Number(order.orderNo.slice(prefix.length));
    return Number.isFinite(numeric) ? Math.max(current, numeric) : current;
  }, 1000);
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

export function nextTimestamp(previous?: string): string {
  const now = new Date().toISOString();
  if (!previous) return now;
  return now > previous ? now : new Date(Date.parse(previous) + 1000).toISOString();
}
