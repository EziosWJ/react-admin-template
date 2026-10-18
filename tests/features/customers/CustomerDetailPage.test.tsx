import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import CustomerDetailPage from '../../../src/features/customers/CustomerDetailPage';
import CustomerEditPage from '../../../src/features/customers/CustomerEditPage';
import { renderWithProviders } from '../../utils/renderWithProviders';
import { setFieldValue } from '../../utils/antd';

function customerRoutes() {
  return (
    <Routes>
      <Route path="/customers/:id" element={<CustomerDetailPage />} />
      <Route path="/customers/:id/edit" element={<CustomerEditPage />} />
    </Routes>
  );
}

describe('CustomerDetailPage and CustomerEditPage', () => {
  it('shows customer data and related projects and orders', async () => {
    renderWithProviders(customerRoutes(), { route: '/customers/c-001' });

    expect(await screen.findByRole('heading', { name: '星云科技' }, { timeout: 20_000 })).toBeInTheDocument();
    expect(await screen.findByText('星云数据中台建设', {}, { timeout: 20_000 })).toBeInTheDocument();
    expect(await screen.findAllByText(/^SO-\d{4}-\d{4}$/)).not.toHaveLength(0);
    expect(screen.getByText('CUS-1001')).toBeInTheDocument();
  });

  it('explains why a referenced customer cannot be deleted', async () => {
    const user = userEvent.setup();
    renderWithProviders(customerRoutes(), { route: '/customers/c-001' });

    await screen.findByRole('heading', { name: '星云科技' }, { timeout: 20_000 });
    await user.click(screen.getByRole('button', { name: '删除客户' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(withinDialog(dialog, '删除'));

    expect(await screen.findByText(/仍关联 .* 个项目、.* 个订单，无法删除/, {}, { timeout: 20_000 })).toBeInTheDocument();
  });

  it('edits a customer on the full edit page and returns to the refreshed detail page', async () => {
    const user = userEvent.setup();
    renderWithProviders(customerRoutes(), { route: '/customers/c-001/edit' });

    const nameInput = await screen.findByLabelText('客户名称', {}, { timeout: 20_000 });
    expect(nameInput).toHaveValue('星云科技');

    setFieldValue('客户名称', '星云科技（更新）');
    await user.click(screen.getByRole('button', { name: '保存修改' }));

    expect(await screen.findByText('客户信息已更新', {}, { timeout: 20_000 })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: '星云科技（更新）' }, { timeout: 20_000 }),
    ).toBeInTheDocument();
  });
});

function withinDialog(dialog: HTMLElement, name: string) {
  const button = Array.from(dialog.querySelectorAll('button')).find(
    (element) => element.textContent?.replace(/\s/g, '') === name,
  );
  if (!button) throw new Error(`button ${name} not found in dialog`);
  return button;
}
