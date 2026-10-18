import type {
  CustomerListQuery,
  OrderListQuery,
  ProjectListQuery,
  UserListQuery,
} from '../types/models';
import type { DashboardRange } from '../features/dashboard/types';

export const queryKeys = {
  customers: {
    all: ['customers'] as const,
    lists: () => ['customers', 'list'] as const,
    list: (query: CustomerListQuery) => ['customers', 'list', query] as const,
    details: () => ['customers', 'detail'] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
    options: () => ['customers', 'options'] as const,
  },
  projects: {
    all: ['projects'] as const,
    lists: () => ['projects', 'list'] as const,
    list: (query: ProjectListQuery) => ['projects', 'list', query] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
    options: () => ['projects', 'options'] as const,
  },
  orders: {
    all: ['orders'] as const,
    lists: () => ['orders', 'list'] as const,
    list: (query: OrderListQuery) => ['orders', 'list', query] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => ['users', 'list'] as const,
    list: (query: UserListQuery) => ['users', 'list', query] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
    options: () => ['users', 'options'] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    summary: (range: DashboardRange) => ['dashboard', 'summary', range] as const,
  },
} as const;
