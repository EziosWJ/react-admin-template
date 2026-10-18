import { apiClient } from '../../lib/api/client';
import { compactParams } from '../../lib/api/params';
import type { PaginatedResult } from '../../types/api';
import type { User, UserInput, UserListQuery } from '../../types/models';

export const usersApi = {
  async list(query: UserListQuery): Promise<PaginatedResult<User>> {
    const response = await apiClient.get<PaginatedResult<User>>('/users', {
      params: compactParams(query as unknown as Record<string, unknown>),
    });
    return response.data;
  },
  async get(id: string): Promise<User> {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },
  async create(input: UserInput): Promise<User> {
    const response = await apiClient.post<User>('/users', input);
    return response.data;
  },
  async update(id: string, input: UserInput): Promise<User> {
    const response = await apiClient.put<User>(`/users/${id}`, input);
    return response.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};
