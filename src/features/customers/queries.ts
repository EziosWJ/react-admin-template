import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { invalidateEntityQueries } from '../../lib/invalidation';
import { queryKeys } from '../../lib/queryKeys';
import type { CustomerInput, CustomerListQuery } from '../../types/models';
import { customersApi } from './api';

export function useCustomerList(query: CustomerListQuery) {
  return useQuery({
    queryKey: queryKeys.customers.list(query),
    queryFn: () => customersApi.list(query),
    placeholderData: keepPreviousData,
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id ?? ''),
    queryFn: () => customersApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useCustomerOptions() {
  return useQuery({
    queryKey: queryKeys.customers.options(),
    queryFn: () => customersApi.list({ page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc' }),
    staleTime: 60_000,
  });
}

export function useCustomerMutations() {
  const client = useQueryClient();
  const invalidate = useCallback(() => invalidateEntityQueries(client, ['customers']), [client]);

  const create = useMutation({
    mutationFn: (input: CustomerInput) => customersApi.create(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CustomerInput }) => customersApi.update(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => customersApi.remove(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
