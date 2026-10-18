import type { ProjectStatus } from '../../types/models';

export type DashboardRange = '30d' | '90d' | '12m';

export const DASHBOARD_RANGE_OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: '30d', label: '近 30 天' },
  { value: '90d', label: '近 90 天' },
  { value: '12m', label: '近 12 个月' },
];

export function isDashboardRange(value: string | null | undefined): value is DashboardRange {
  return value === '30d' || value === '90d' || value === '12m';
}

export interface DashboardSummary {
  range: DashboardRange;
  rangeLabel: string;
  from: string;
  to: string;
  metrics: {
    customers: number;
    activeProjects: number;
    pendingOrders: number;
    activeUsers: number;
  };
  projectStatus: { status: ProjectStatus; count: number }[];
  orderTrend: { key: string; label: string; amount: number; count: number }[];
  totals: {
    orderAmount: number;
    orderCount: number;
  };
}
