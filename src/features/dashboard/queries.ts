import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { dashboardApi } from './api';
import type { DashboardRange } from './types';

export function useDashboardSummary(range: DashboardRange) {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(range),
    queryFn: () => dashboardApi.getSummary(range),
  });
}
