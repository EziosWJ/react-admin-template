import { http, HttpResponse } from 'msw';
import dayjs, { type Dayjs } from 'dayjs';
import { apiPath } from '../../config/env';
import { PROJECT_STATUS_OPTIONS } from '../../config/options';
import type { DashboardRange, DashboardSummary } from '../../features/dashboard/types';
import { isDashboardRange } from '../../features/dashboard/types';
import { getMockDatabase } from '../db';
import { simulateLatency } from './shared';

interface RangeWindow {
  from: Dayjs;
  to: Dayjs;
  label: string;
}

function resolveRange(range: DashboardRange): RangeWindow {
  const now = dayjs();
  if (range === '90d') {
    return { from: now.subtract(89, 'day').startOf('day'), to: now.endOf('day'), label: '近 90 天' };
  }
  if (range === '12m') {
    return { from: now.subtract(11, 'month').startOf('month'), to: now.endOf('day'), label: '近 12 个月' };
  }
  return { from: now.subtract(29, 'day').startOf('day'), to: now.endOf('day'), label: '近 30 天' };
}

interface OrderTrendBucket {
  key: string;
  label: string;
  start: Dayjs;
  end: Dayjs;
  amount: number;
  count: number;
}

function buildBuckets(range: DashboardRange, window: RangeWindow): OrderTrendBucket[] {
  if (range === '12m') {
    return Array.from({ length: 12 }, (_, index) => {
      const start = window.from.add(index, 'month').startOf('month');
      return {
        key: start.format('YYYY-MM'),
        label: start.format('M月'),
        start,
        end: start.add(1, 'month').startOf('month'),
        amount: 0,
        count: 0,
      };
    });
  }

  if (range === '90d') {
    return Array.from({ length: 13 }, (_, index) => {
      const start = window.from.add(index * 7, 'day').startOf('day');
      return {
        key: start.format('YYYY-MM-DD'),
        label: start.format('M/D'),
        start,
        end: start.add(7, 'day'),
        amount: 0,
        count: 0,
      };
    });
  }

  return Array.from({ length: 30 }, (_, index) => {
    const start = window.from.add(index, 'day').startOf('day');
    return {
      key: start.format('YYYY-MM-DD'),
      label: start.format('M/D'),
      start,
      end: start.add(1, 'day'),
      amount: 0,
      count: 0,
    };
  });
}

export const dashboardHandlers = [
  http.get(apiPath('/dashboard'), async ({ request }) => {
    await simulateLatency();
    const db = getMockDatabase();
    const rangeParam = new URL(request.url).searchParams.get('range');
    const range: DashboardRange = isDashboardRange(rangeParam) ? rangeParam : '30d';
    const window = resolveRange(range);
    const fromDate = window.from.format('YYYY-MM-DD');
    const toDate = window.to.format('YYYY-MM-DD');

    const metrics = {
      customers: db.customers.length,
      activeProjects: db.projects.filter((project) => project.status === 'in_progress').length,
      pendingOrders: db.orders.filter((order) => order.status === 'pending').length,
      activeUsers: db.users.filter((user) => user.status === 'active').length,
    };

    const scopedProjects = db.projects.filter(
      (project) => project.startDate >= fromDate && project.startDate <= toDate,
    );
    const projectStatus = PROJECT_STATUS_OPTIONS.map((option) => ({
      status: option.value,
      count: scopedProjects.filter((project) => project.status === option.value).length,
    })).filter((item) => item.count > 0);

    const buckets = buildBuckets(range, window);
    db.orders
      .filter((order) => order.status !== 'cancelled')
      .forEach((order) => {
        const orderDay = dayjs(order.orderDate);
        const bucket = buckets.find((item) => !orderDay.isBefore(item.start) && orderDay.isBefore(item.end));
        if (!bucket) return;
        bucket.amount += order.amount;
        bucket.count += 1;
      });

    const orderTrend = buckets.map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      amount: bucket.amount,
      count: bucket.count,
    }));
    const totals = orderTrend.reduce(
      (accumulator, item) => ({
        orderAmount: accumulator.orderAmount + item.amount,
        orderCount: accumulator.orderCount + item.count,
      }),
      { orderAmount: 0, orderCount: 0 },
    );

    const summary: DashboardSummary = {
      range,
      rangeLabel: window.label,
      from: fromDate,
      to: toDate,
      metrics,
      projectStatus,
      orderTrend,
      totals,
    };
    return HttpResponse.json(summary);
  }),
];
