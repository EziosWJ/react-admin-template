import { apiClient } from '../../lib/api/client';
import type { DashboardRange, DashboardSummary } from './types';

export const dashboardApi = {
  async getSummary(range: DashboardRange): Promise<DashboardSummary> {
    const response = await apiClient.get<DashboardSummary>('/dashboard', { params: { range } });
    return response.data;
  },
};
