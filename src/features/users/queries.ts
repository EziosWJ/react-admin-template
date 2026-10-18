import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { invalidateEntityQueries } from '../../lib/invalidation';
import { queryKeys } from '../../lib/queryKeys';
import type { UserInput, UserListQuery } from '../../types/models';
import { usersApi } from './api';

export function useUserList(query: UserListQuery) {
  return useQuery({
    queryKey: queryKeys.users.list(query),
    queryFn: () => usersApi.list(query),
    placeholderData: keepPreviousData,
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.users.detail(id ?? ''),
    queryFn: () => usersApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useUserOptions() {
  return useQuery({
    queryKey: queryKeys.users.options(),
    queryFn: () => usersApi.list({ page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc' }),
    staleTime: 60_000,
  });
}

export function useUserMutations() {
  const client = useQueryClient();
  const invalidate = useCallback(() => invalidateEntityQueries(client, ['users']), [client]);

  const create = useMutation({
    mutationFn: (input: UserInput) => usersApi.create(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UserInput }) => usersApi.update(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
