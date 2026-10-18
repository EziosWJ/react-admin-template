import { beforeEach, describe, expect, it } from 'vitest';
import { HOME_TAB, useTabsStore } from '../../src/stores/useTabsStore';

describe('page tabs store', () => {
  beforeEach(() => {
    useTabsStore.setState({ tabs: [HOME_TAB] });
  });

  it('adds a tab when a route is opened and activates it by URL', () => {
    useTabsStore.getState().openTab({ key: '/customers', label: '客户管理', href: '/customers', closable: true });
    const tabs = useTabsStore.getState().tabs;

    expect(tabs).toHaveLength(2);
    expect(tabs[1]).toMatchObject({ key: '/customers', label: '客户管理', closable: true });
  });

  it('updates an existing tab href instead of creating a duplicate', () => {
    const { openTab } = useTabsStore.getState();
    openTab({ key: '/customers', label: '客户管理', href: '/customers', closable: true });
    openTab({
      key: '/customers',
      label: '客户管理',
      href: '/customers?status=active',
      closable: true,
    });

    const tabs = useTabsStore.getState().tabs;
    expect(tabs).toHaveLength(2);
    expect(tabs[1].href).toBe('/customers?status=active');
  });

  it('closes closable tabs but never removes the home tab', () => {
    const { openTab, closeTab } = useTabsStore.getState();
    openTab({ key: '/customers', label: '客户管理', href: '/customers', closable: true });
    openTab({ key: '/projects', label: '项目管理', href: '/projects', closable: true });

    closeTab('/customers');
    expect(useTabsStore.getState().tabs.map((tab) => tab.key)).toEqual(['/', '/projects']);

    closeTab('/');
    expect(useTabsStore.getState().tabs.map((tab) => tab.key)).toEqual(['/', '/projects']);
  });

  it('persists tabs to sessionStorage for refresh recovery', () => {
    useTabsStore.getState().openTab({ key: '/orders', label: '订单管理', href: '/orders', closable: true });
    const stored = window.sessionStorage.getItem('admin-page-tabs');
    expect(stored).toBeTruthy();
    expect(stored).toContain('订单管理');
  });
});
