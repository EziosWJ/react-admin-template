import { apiClient } from '../../lib/api/client';
import { compactParams } from '../../lib/api/params';
import type { PaginatedResult } from '../../types/api';
import type { Project, ProjectInput, ProjectListQuery } from '../../types/models';

export const projectsApi = {
  async list(query: ProjectListQuery): Promise<PaginatedResult<Project>> {
    const response = await apiClient.get<PaginatedResult<Project>>('/projects', {
      params: compactParams(query as unknown as Record<string, unknown>),
    });
    return response.data;
  },
  async get(id: string): Promise<Project> {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    return response.data;
  },
  async create(input: ProjectInput): Promise<Project> {
    const response = await apiClient.post<Project>('/projects', input);
    return response.data;
  },
  async update(id: string, input: ProjectInput): Promise<Project> {
    const response = await apiClient.put<Project>(`/projects/${id}`, input);
    return response.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}`);
  },
};
