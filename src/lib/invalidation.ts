import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export type EntityKey = 'customers' | 'projects' | 'orders' | 'users';

export function invalidateEntityQueries(client: QueryClient, entities: EntityKey[]): void {
  entities.forEach((entity) => {
    void client.invalidateQueries({ queryKey: queryKeys[entity].all });
  });
  void client.invalidateQueries({ queryKey: queryKeys.dashboard.all });
}
