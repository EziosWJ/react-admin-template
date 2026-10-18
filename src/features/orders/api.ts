import { apiClient } from '../../lib/api/client';
import { compactParams } from '../../lib/api/params';
import type { PaginatedResult } from '../../types/api';
import type { Order, OrderInput, OrderListQuery } from '../../types/models';

export const ordersApi = {
  async list(query: OrderListQuery): Promise<PaginatedResult<Order>> {
    const response = await apiClient.get<PaginatedResult<Order>>('/orders', {
      params: compactParams(query as unknown as Record<string, unknown>),
    });
    return response.data;
  },
  async get(id: string): Promise<Order> {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  },
  async create(input: OrderInput): Promise<Order> {
    const response = await apiClient.post<Order>('/orders', input);
    return response.data;
  },
  async update(id: string, input: OrderInput): Promise<Order> {
    const response = await apiClient.put<Order>(`/orders/${id}`, input);
    return response.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/orders/${id}`);
  },
};
