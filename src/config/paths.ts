export const paths = Object.freeze({
  dashboard: '/',
  customers: '/customers',
  customerNew: '/customers/new',
  customerDetail: (id: string) => `/customers/${encodeURIComponent(id)}`,
  customerEdit: (id: string) => `/customers/${encodeURIComponent(id)}/edit`,
  projects: '/projects',
  projectDetail: (id: string) => `/projects/${encodeURIComponent(id)}`,
  projectEdit: (id: string) => `/projects/${encodeURIComponent(id)}/edit`,
  orders: '/orders',
  orderDetail: (id: string) => `/orders/${encodeURIComponent(id)}`,
  orderEdit: (id: string) => `/orders/${encodeURIComponent(id)}/edit`,
  users: '/users',
  userDetail: (id: string) => `/users/${encodeURIComponent(id)}`,
  userEdit: (id: string) => `/users/${encodeURIComponent(id)}/edit`,
});

export function withListFilters(base: string, filters: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
