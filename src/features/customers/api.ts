import { apiClient } from '../../lib/api/client';
import { compactParams } from '../../lib/api/params';
import type { PaginatedResult } from '../../types/api';
import type { Customer, CustomerInput, CustomerListQuery } from '../../types/models';

export const customersApi = {
  async list(query: CustomerListQuery): Promise<PaginatedResult<Customer>> {
    const response = await apiClient.get<PaginatedResult<Customer>>('/customers', {
      params: compactParams(query as unknown as Record<string, unknown>),
    });
    return response.data;
  },
  async get(id: string): Promise<Customer> {
    const response = await apiClient.get<Customer>(`/customers/${id}`);
    return response.data;
  },
  async create(input: CustomerInput): Promise<Customer> {
    const response = await apiClient.post<Customer>('/customers', input);
    return response.data;
  },
  async update(id: string, input: CustomerInput): Promise<Customer> {
    const response = await apiClient.put<Customer>(`/customers/${id}`, input);
    return response.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/customers/${id}`);
  },
};
