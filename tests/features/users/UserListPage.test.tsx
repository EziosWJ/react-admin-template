import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import UserListPage from '../../../src/features/users/UserListPage';
import { chooseSelectOption } from '../../utils/antd';
import { renderWithProviders } from '../../utils/renderWithProviders';
import { setFieldValue } from '../../utils/antd';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

describe('UserListPage', () => {
  it('loads business users and syncs department filters to the URL', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(
      <>
        <UserListPage />
        <LocationProbe />
      </>,
      { route: '/users', path: '/users' },
    );

    expect(await screen.findByText('邓超', {}, { timeout: 20_000 })).toBeInTheDocument();
    expect(screen.getByText(/不包含登录、认证、密码或权限/)).toBeInTheDocument();

    await chooseSelectOption(user, document, '按部门筛选', '产品研发部');
    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toContain('department=product');
    });
    expect((await screen.findAllByText('产品研发部')).length).toBeGreaterThan(0);
  });

  it('creates a business user with validation and refreshes the list', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<UserListPage />, { route: '/users', path: '/users' });
    await screen.findByText('邓超', {}, { timeout: 20_000 });

    await user.click(screen.getByRole('button', { name: '新建用户' }));
    const drawer = await screen.findByRole('dialog');

    setFieldValue('姓名', '测试用户', drawer);
    setFieldValue('用户名', 'e2euser', drawer);
    setFieldValue('邮箱', 'e2euser@example.com', drawer);
    await user.click(within(drawer).getByRole('button', { name: '创建用户' }));

    expect(await screen.findByText('用户创建成功', {}, { timeout: 20_000 })).toBeInTheDocument();

    setFieldValue('搜索用户', 'e2euser');
    expect(await screen.findByText('测试用户', {}, { timeout: 20_000 })).toBeInTheDocument();
  });

  it('confirms before disabling a user and reflects the new status', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<UserListPage />, { route: '/users', path: '/users' });
    await screen.findByText('邓超', {}, { timeout: 20_000 });

    const row = screen.getByText('邓超').closest('tr')!;
    await user.click(within(row).getByRole('button', { name: '停用' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = Array.from(dialog.querySelectorAll('button')).find(
      (element) => element.textContent?.replace(/\s/g, '') === '停用',
    );
    expect(confirm).toBeDefined();
    await user.click(confirm!);

    expect(await screen.findByText('用户已停用', {}, { timeout: 20_000 })).toBeInTheDocument();
    await waitFor(() => {
      expect(within(screen.getByText('邓超').closest('tr')!).getByText('已停用')).toBeInTheDocument();
    });
  });
});
