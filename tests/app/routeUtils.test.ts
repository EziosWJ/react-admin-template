import { describe, expect, it } from 'vitest';
import {
  fillPathPattern,
  findRouteDefinition,
  getActiveMenuPath,
  getBreadcrumbs,
  getTabKey,
  getTabLabel,
  normalizePathname,
} from '../../src/config/routeUtils';
import { menuRouteDefinitions, routeDefinitions } from '../../src/config/routes';

describe('route metadata utilities', () => {
  it('finds list, detail and edit routes with params', () => {
    expect(findRouteDefinition('/customers')?.route.label).toBe('客户管理');
    const detail = findRouteDefinition('/customers/c-001');
    expect(detail?.route.path).toBe('/customers/:id');
    expect(detail?.params.id).toBe('c-001');

    const edit = findRouteDefinition('/customers/c-001/edit');
    expect(edit?.route.path).toBe('/customers/:id/edit');
    expect(edit?.params.id).toBe('c-001');

    expect(findRouteDefinition('/not-a-route')).toBeUndefined();
    expect(normalizePathname('/customers///')).toBe('/customers');
    expect(normalizePathname('/')).toBe('/');
  });

  it('builds hrefs from path patterns', () => {
    expect(fillPathPattern('/customers/:id', { id: 'c 1' })).toBe('/customers/c%201');
    expect(fillPathPattern('/customers/:id/edit', { id: 'c-1' })).toBe('/customers/c-1/edit');
  });

  it('derives breadcrumbs from the same route configuration', () => {
    expect(getBreadcrumbs('/')).toEqual([{ label: '仪表盘' }]);
    expect(getBreadcrumbs('/customers')).toEqual([
      { label: '仪表盘', href: '/' },
      { label: '客户管理' },
    ]);
    expect(getBreadcrumbs('/customers/c-001')).toEqual([
      { label: '仪表盘', href: '/' },
      { label: '客户管理', href: '/customers' },
      { label: '客户详情' },
    ]);
    expect(getBreadcrumbs('/customers/c-001/edit')).toEqual([
      { label: '仪表盘', href: '/' },
      { label: '客户管理', href: '/customers' },
      { label: '客户详情', href: '/customers/c-001' },
      { label: '编辑客户' },
    ]);
    expect(getBreadcrumbs('/missing')).toEqual([
      { label: '仪表盘', href: '/' },
      { label: '页面未找到' },
    ]);
  });

  it('derives the active menu root, tab label and tab key', () => {
    expect(getActiveMenuPath('/projects/p-001/edit')).toBe('/projects');
    expect(getActiveMenuPath('/users')).toBe('/users');
    expect(getActiveMenuPath('/unknown')).toBe('/');
    expect(getTabLabel('/orders/o-001')).toBe('订单详情');
    expect(getTabLabel('/unknown')).toBe('页面');
    expect(getTabKey('/customers/')).toBe('/customers');
    expect(getTabKey('/')).toBe('/');
  });

  it('keeps detail and edit routes out of the menu', () => {
    expect(menuRouteDefinitions.map((route) => route.path)).toEqual([
      '/',
      '/customers',
      '/projects',
      '/orders',
      '/users',
    ]);
    expect(routeDefinitions.filter((route) => route.hideInMenu)).toHaveLength(8);
    expect(menuRouteDefinitions.every((route) => route.icon)).toBe(true);
  });
});
