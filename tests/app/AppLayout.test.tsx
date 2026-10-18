import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AppLayout from '../../src/layouts/AppLayout';
import { AppProviders } from '../../src/app/AppProviders';
import { HOME_TAB, useTabsStore } from '../../src/stores/useTabsStore';
import { createTestQueryClient } from '../utils/renderWithProviders';

function setViewport(width: number) {
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
    const min = /min-width:\s*(\d+(?:\.\d+)?)px/.exec(query);
    const max = /max-width:\s*(\d+(?:\.\d+)?)px/.exec(query);
    const matches = min ? width >= Number(min[1]) : max ? width <= Number(max[1]) : false;
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
  });
}

function renderLayout(route = '/customers') {
  return render(
    <AppProviders client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<div>仪表盘内容</div>} />
            <Route path="customers" element={<div>客户内容</div>} />
            <Route path="projects" element={<div>项目内容</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  );
}

beforeEach(() => {
  useTabsStore.setState({ tabs: [HOME_TAB] });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AppLayout', () => {
  it('renders desktop navigation, breadcrumbs and page tabs from centralized routes', async () => {
    setViewport(1280);
    renderLayout();

    expect(await screen.findByText('客户内容')).toBeInTheDocument();
    expect(screen.getByRole('menu', { name: '主导航' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /客户管理/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '客户管理' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '仪表盘' })).toBeInTheDocument();
    expect(document.querySelector('.ant-breadcrumb')?.textContent).toContain('客户管理');
  });

  it('persists sidebar collapse preference to localStorage', async () => {
    setViewport(1280);
    const user = userEvent.setup({ delay: null });
    renderLayout();
    await screen.findByText('客户内容');

    await user.click(screen.getByRole('button', { name: '折叠侧边栏' }));
    expect(window.localStorage.getItem('admin-sidebar-collapsed')).toBe('true');
    expect(screen.getByRole('button', { name: '展开侧边栏' })).toBeInTheDocument();
  });

  it('opens tabs, keeps them in sessionStorage and closes the active tab to a neighbor', async () => {
    setViewport(1280);
    const user = userEvent.setup({ delay: null });
    renderLayout();
    await screen.findByText('客户内容');

    await user.click(screen.getByRole('menuitem', { name: /项目管理/ }));
    expect(await screen.findByText('项目内容')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '项目管理' })).toBeInTheDocument();
    expect(window.sessionStorage.getItem('admin-page-tabs')).toContain('项目管理');

    const projectTab = screen.getByRole('tab', { name: '项目管理' });
    const tabContainer = projectTab.closest('.ant-tabs-tab');
    const removeButton = tabContainer?.querySelector('.ant-tabs-tab-remove');
    expect(removeButton).toBeTruthy();
    await act(async () => {
      removeButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(await screen.findByText('客户内容')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('tab', { name: '项目管理' })).not.toBeInTheDocument();
    });
  });

  it('uses a drawer navigation on narrow screens', async () => {
    setViewport(375);
    const user = userEvent.setup({ delay: null });
    renderLayout();
    await screen.findByText('客户内容');

    const openButton = screen.getByRole('button', { name: '打开导航菜单' });
    await user.click(openButton);

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('menuitem', { name: /项目管理/ }));

    expect(await screen.findByText('项目内容')).toBeInTheDocument();
  });
});
