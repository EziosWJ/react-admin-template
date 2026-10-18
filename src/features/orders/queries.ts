import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { invalidateEntityQueries } from '../../lib/invalidation';
import { queryKeys } from '../../lib/queryKeys';
import type { OrderInput, OrderListQuery } from '../../types/models';
import { ordersApi } from './api';

export function useOrderList(query: OrderListQuery) {
  return useQuery({
    queryKey: queryKeys.orders.list(query),
    queryFn: () => ordersApi.list(query),
    placeholderData: keepPreviousData,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id ?? ''),
    queryFn: () => ordersApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useOrderMutations() {
  const client = useQueryClient();
  const invalidate = useCallback(() => invalidateEntityQueries(client, ['orders']), [client]);

  const create = useMutation({
    mutationFn: (input: OrderInput) => ordersApi.create(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: OrderInput }) => ordersApi.update(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => ordersApi.remove(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
