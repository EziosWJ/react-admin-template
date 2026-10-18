import { describe, expect, it } from 'vitest';
import { apiClient } from '../../src/lib/api/client';
import { ApiError } from '../../src/lib/api/errors';
import type { DashboardSummary } from '../../src/features/dashboard/types';
import type { PaginatedResult } from '../../src/types/api';
import type { Customer, Order, Project, User } from '../../src/types/models';

async function getList<T>(path: string, params: Record<string, unknown> = {}): Promise<PaginatedResult<T>> {
  const response = await apiClient.get<PaginatedResult<T>>(path, { params });
  return response.data;
}

describe('MSW business API', () => {
  it('paginates, searches, filters and sorts customer data', async () => {
    const firstPage = await getList<Customer>('/customers', { page: 1, pageSize: 5 });
    expect(firstPage.items).toHaveLength(5);
    expect(firstPage.total).toBe(24);

    const search = await getList<Customer>('/customers', { keyword: '星云', page: 1, pageSize: 10 });
    expect(search.items.some((item) => item.name.includes('星云'))).toBe(true);

    const active = await getList<Customer>('/customers', { status: 'active', page: 1, pageSize: 100 });
    expect(active.items.every((item) => item.status === 'active')).toBe(true);

    const sorted = await getList<Customer>('/customers', {
      sortBy: 'name',
      sortOrder: 'asc',
      page: 1,
      pageSize: 100,
    });
    const names = sorted.items.map((item) => item.name);
    expect(names).toEqual([...names].sort((left, right) => left.localeCompare(right, 'zh-CN')));
  });

  it('creates, updates and deletes an unreferenced customer while enforcing code uniqueness', async () => {
    const before = await getList<Customer>('/customers', { page: 1, pageSize: 10 });
    const created = await apiClient.post<Customer>('/customers', {
      name: '测试客户',
      code: 'CUS-TEST',
      industry: '互联网',
      contactName: '测试联系人',
      phone: '13900000000',
      email: 'tester@example.com',
      status: 'lead',
      notes: '由自动化测试创建',
    });
    expect(created.status).toBe(201);
    expect(created.data.id).toMatch(/^c-\d+$/);

    const afterCreate = await getList<Customer>('/customers', { page: 1, pageSize: 10 });
    expect(afterCreate.total).toBe(before.total + 1);

    await expect(
      apiClient.post('/customers', {
        name: '重复编码客户',
        code: 'CUS-TEST',
        industry: '互联网',
        contactName: '测试联系人',
        phone: '13900000000',
        email: 'tester2@example.com',
        status: 'lead',
        notes: '',
      }),
    ).rejects.toMatchObject({ kind: 'client', status: 409, code: 'duplicate_code', field: 'code' });

    const updated = await apiClient.put<Customer>(`/customers/${created.data.id}`, {
      ...created.data,
      name: '测试客户（已更新）',
      status: 'active',
    });
    expect(updated.data.name).toBe('测试客户（已更新）');
    expect(updated.data.code).toBe('CUS-TEST');

    await apiClient.delete(`/customers/${created.data.id}`);
    const afterDelete = await getList<Customer>('/customers', { page: 1, pageSize: 10 });
    expect(afterDelete.total).toBe(before.total);
  });

  it('blocks deleting a customer that still has projects or orders', async () => {
    await expect(apiClient.delete('/customers/c-001')).rejects.toMatchObject({
      kind: 'client',
      status: 409,
      code: 'customer_has_references',
    });
  });

  it('returns normalized not-found errors', async () => {
    const error = await apiClient.get('/customers/missing-id').catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: 'client', status: 404, code: 'not_found' });
  });

  it('filters projects by customer, status and date range and resolves references', async () => {
    const byCustomer = await getList<Project>('/projects', {
      customerId: 'c-001',
      page: 1,
      pageSize: 100,
    });
    expect(byCustomer.items.length).toBeGreaterThan(0);
    expect(byCustomer.items.every((item) => item.customerId === 'c-001')).toBe(true);

    const inProgress = await getList<Project>('/projects', {
      status: 'in_progress',
      page: 1,
      pageSize: 100,
    });
    expect(inProgress.items.length).toBeGreaterThan(0);
    expect(inProgress.items.every((item) => item.status === 'in_progress')).toBe(true);

    const sample = byCustomer.items[0];
    const byDate = await getList<Project>('/projects', {
      dateFrom: sample.startDate,
      dateTo: sample.startDate,
      page: 1,
      pageSize: 100,
    });
    expect(byDate.items.every((item) => item.startDate === sample.startDate)).toBe(true);
  });

  it('validates project references and blocks deletion when orders reference the project', async () => {
    await expect(
      apiClient.post('/projects', {
        name: '无效客户项目',
        code: 'PRJ-BADREF',
        customerId: 'missing-customer',
        owner: '陈晨',
        status: 'planning',
        progress: 0,
        startDate: '2026-01-01',
        endDate: '2026-02-01',
        budget: 1000,
        notes: '',
      }),
    ).rejects.toMatchObject({ status: 422, field: 'customerId' });

    const orders = await getList<Order>('/orders', { page: 1, pageSize: 100 });
    const linked = orders.items.find((order) => order.projectId);
    expect(linked).toBeDefined();
    await expect(apiClient.delete(`/projects/${linked!.projectId}`)).rejects.toMatchObject({
      status: 409,
      code: 'project_has_references',
    });
  });

  it('filters orders by status and project and maintains customer/project consistency', async () => {
    const pending = await getList<Order>('/orders', { status: 'pending', page: 1, pageSize: 100 });
    expect(pending.items.length).toBeGreaterThan(0);
    expect(pending.items.every((item) => item.status === 'pending')).toBe(true);

    const sample = (await getList<Order>('/orders', { page: 1, pageSize: 100 })).items.find(
      (item) => item.projectId,
    )!;
    const byProject = await getList<Order>('/orders', { projectId: sample.projectId, page: 1, pageSize: 100 });
    expect(byProject.items.every((item) => item.projectId === sample.projectId)).toBe(true);

    const project = await apiClient.get<Project>(`/projects/${sample.projectId}`);
    expect(project.data.customerId).toBe(sample.customerId);
  });

  it('creates orders with generated numbers and rejects mismatched project references', async () => {
    const created = await apiClient.post<Order>('/orders', {
      orderNo: '',
      customerId: 'c-001',
      projectId: null,
      amount: 9999.5,
      status: 'pending',
      orderDate: '2026-10-01',
      dueDate: '2026-11-01',
      notes: '',
    });
    expect(created.status).toBe(201);
    expect(created.data.orderNo).toMatch(/^SO-\d{4}-\d{4,}$/);

    const otherProject = (await getList<Project>('/projects', {
      customerId: 'c-002',
      page: 1,
      pageSize: 1,
    })).items[0];
    expect(otherProject).toBeDefined();

    await expect(
      apiClient.post('/orders', {
        orderNo: '',
        customerId: 'c-001',
        projectId: otherProject.id,
        amount: 100,
        status: 'pending',
        orderDate: '2026-10-01',
        dueDate: '2026-11-01',
        notes: '',
      }),
    ).rejects.toMatchObject({ status: 422, field: 'projectId' });

    await apiClient.delete(`/orders/${created.data.id}`);
  });

  it('enforces user uniqueness and supports enable/disable updates', async () => {
    const users = await getList<User>('/users', { page: 1, pageSize: 100 });
    expect(users.items.length).toBeGreaterThan(0);

    await expect(
      apiClient.post('/users', {
        name: '重复用户',
        username: users.items[0].username,
        email: 'unique@example.com',
        department: 'product',
        role: 'member',
        status: 'active',
      }),
    ).rejects.toMatchObject({ status: 409, code: 'duplicate_username', field: 'username' });

    const target = users.items[0];
    const updated = await apiClient.put<User>(`/users/${target.id}`, {
      name: target.name,
      username: target.username,
      email: target.email,
      department: target.department,
      role: target.role,
      status: target.status === 'active' ? 'disabled' : 'active',
    });
    expect(updated.data.status).toBe(target.status === 'active' ? 'disabled' : 'active');
    expect(updated.data.lastLoginAt).toBe(target.lastLoginAt);
  });

  it('keeps dashboard metrics consistent with the entity lists', async () => {
    const [dashboardResponse, customers, projects, orders, users] = await Promise.all([
      apiClient.get<DashboardSummary>('/dashboard', { params: { range: '30d' } }),
      getList<Customer>('/customers', { page: 1, pageSize: 1 }),
      getList<Project>('/projects', { status: 'in_progress', page: 1, pageSize: 1 }),
      getList<Order>('/orders', { status: 'pending', page: 1, pageSize: 1 }),
      getList<User>('/users', { status: 'active', page: 1, pageSize: 1 }),
    ]);
    const dashboard = dashboardResponse.data;

    expect(dashboard.metrics.customers).toBe(customers.total);
    expect(dashboard.metrics.activeProjects).toBe(projects.total);
    expect(dashboard.metrics.pendingOrders).toBe(orders.total);
    expect(dashboard.metrics.activeUsers).toBe(users.total);
    expect(dashboard.orderTrend).toHaveLength(30);
    expect(dashboard.orderTrend.reduce((sum, item) => sum + item.count, 0)).toBe(dashboard.totals.orderCount);
    expect(dashboard.orderTrend.reduce((sum, item) => sum + item.amount, 0)).toBe(dashboard.totals.orderAmount);
    expect(dashboard.projectStatus.every((item) => item.count > 0)).toBe(true);
  });

  it('returns range-specific dashboard buckets and defaults unknown ranges to 30 days', async () => {
    const [ninety, twelve, fallback] = await Promise.all([
      apiClient.get<DashboardSummary>('/dashboard', { params: { range: '90d' } }),
      apiClient.get<DashboardSummary>('/dashboard', { params: { range: '12m' } }),
      apiClient.get<DashboardSummary>('/dashboard', { params: { range: 'unknown' } }),
    ]);

    expect(ninety.data.orderTrend).toHaveLength(13);
    expect(twelve.data.orderTrend).toHaveLength(12);
    expect(fallback.data.range).toBe('30d');
    expect(fallback.data.orderTrend).toHaveLength(30);
  });
});
