import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { invalidateEntityQueries } from '../../lib/invalidation';
import { queryKeys } from '../../lib/queryKeys';
import type { ProjectInput, ProjectListQuery } from '../../types/models';
import { projectsApi } from './api';

export function useProjectList(query: ProjectListQuery) {
  return useQuery({
    queryKey: queryKeys.projects.list(query),
    queryFn: () => projectsApi.list(query),
    placeholderData: keepPreviousData,
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id ?? ''),
    queryFn: () => projectsApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useProjectOptions(customerId?: string) {
  return useQuery({
    queryKey: [...queryKeys.projects.options(), customerId ?? 'all'],
    queryFn: () =>
      projectsApi.list({
        page: 1,
        pageSize: 100,
        customerId,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
    staleTime: 60_000,
  });
}

export function useProjectMutations() {
  const client = useQueryClient();
  const invalidate = useCallback(
    () => invalidateEntityQueries(client, ['projects', 'orders']),
    [client],
  );

  const create = useMutation({
    mutationFn: (input: ProjectInput) => projectsApi.create(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProjectInput }) => projectsApi.update(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
