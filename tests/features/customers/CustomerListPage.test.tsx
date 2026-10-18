import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import CustomerListPage from '../../../src/features/customers/CustomerListPage';
import { renderWithProviders } from '../../utils/renderWithProviders';
import { setFieldValue } from '../../utils/antd';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

async function chooseOption(
  user: ReturnType<typeof userEvent.setup>,
  scope: HTMLElement | Document,
  label: string,
  option: string,
) {
  const scopeQuery = 'querySelectorAll' in scope && scope instanceof Document ? screen : within(scope);
  await user.click(scopeQuery.getByLabelText(label));
  const dropdown = await waitFor(() => {
    const candidates = Array.from(document.querySelectorAll('.ant-select-dropdown')).filter(
      (element) => !element.className.includes('hidden'),
    );
    const element = candidates[candidates.length - 1];
    if (!element) throw new Error(`dropdown for ${label} not found`);
    return element as HTMLElement;
  });
  const matches = Array.from(dropdown.querySelectorAll('.ant-select-item-option')).filter(
    (element) => element.textContent?.trim() === option,
  );
  if (matches.length === 0) throw new Error(`option ${option} not found`);
  await user.click(matches[matches.length - 1] as HTMLElement);
}

describe('CustomerListPage', () => {
  it('loads customers, searches through the URL and resets filters', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <CustomerListPage />
        <LocationProbe />
      </>,
      { route: '/customers', path: '/customers' },
    );

    expect(await screen.findByText('明德人力', {}, { timeout: 20_000 })).toBeInTheDocument();
    expect(screen.getAllByText(/共 24 条/).length).toBeGreaterThan(0);

    setFieldValue('搜索客户', '星云');
    expect(screen.queryByText('星云科技')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '查询' }));
    expect(await screen.findByText('星云科技', {}, { timeout: 20_000 })).toBeInTheDocument();
    await waitFor(() => {
      expect(decodeURIComponent(screen.getByTestId('location').textContent ?? '')).toContain('q=星云');
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    await waitFor(() => {
      expect(screen.getByLabelText('搜索客户')).toHaveValue('');
      expect(screen.getByTestId('location').textContent).toBe('/customers');
    });
  });

  it('applies status filters and column sorting to URL state', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <CustomerListPage />
        <LocationProbe />
      </>,
      { route: '/customers', path: '/customers' },
    );

    await screen.findByText('明德人力', {}, { timeout: 20_000 });

    await chooseOption(user, document, '按客户状态筛选', '合作中');
    expect(screen.getByTestId('location').textContent).not.toContain('status=active');
    await user.click(screen.getByRole('button', { name: '查询' }));
    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toContain('status=active');
    });

    await user.click(screen.getByRole('columnheader', { name: /客户名称/ }));
    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toContain('sortBy=name');
      expect(screen.getByTestId('location').textContent).toContain('sortOrder=asc');
    });
  });

  it('creates a customer through the drawer and refreshes the list', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CustomerListPage />, { route: '/customers', path: '/customers' });
    await screen.findByText('明德人力', {}, { timeout: 20_000 });

    await user.click(screen.getByRole('button', { name: '新建客户' }));
    expect(await screen.findByText('新建客户', { selector: '.ant-drawer-title' })).toBeInTheDocument();
    const drawer = await screen.findByRole('dialog');

    setFieldValue('客户名称', '自动化测试客户', drawer);
    setFieldValue('客户编码', 'CUS-E2E-1', drawer);
    setFieldValue('联系人', '测试联系人', drawer);
    setFieldValue('联系电话', '13911112222', drawer);
    setFieldValue('邮箱', 'e2e@example.com', drawer);
    await chooseOption(user, drawer, '所属行业', '互联网');
    setFieldValue('备注', '由自动化测试创建', drawer);

    await user.click(screen.getByRole('button', { name: '创建客户' }));

    expect(await screen.findByText('客户创建成功', {}, { timeout: 20_000 })).toBeInTheDocument();
    setFieldValue('搜索客户', '自动化测试客户');
    await user.click(screen.getByRole('button', { name: '查询' }));
    expect(await screen.findByText('自动化测试客户', {}, { timeout: 20_000 })).toBeInTheDocument();
  });
});
