import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import OrderDetailPage from '../../../src/features/orders/OrderDetailPage';
import OrderEditPage from '../../../src/features/orders/OrderEditPage';
import { chooseSelectOption } from '../../utils/antd';
import { renderWithProviders } from '../../utils/renderWithProviders';

function orderRoutes() {
  return (
    <Routes>
      <Route path="/orders/:id" element={<OrderDetailPage />} />
      <Route path="/orders/:id/edit" element={<OrderEditPage />} />
    </Routes>
  );
}

describe('OrderDetailPage and OrderEditPage', () => {
  it('shows linked customer and project information', async () => {
    renderWithProviders(orderRoutes(), { route: '/orders/o-002' });

    expect(
      await screen.findByRole('heading', { name: /订单 SO-\d{4}-1002/ }, { timeout: 20_000 }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: '云帆互联网' })).toHaveAttribute(
      'href',
      '/customers/c-009',
    );
    expect(await screen.findByRole('link', { name: '云帆增长分析平台' })).toHaveAttribute(
      'href',
      '/projects/p-009',
    );
  });

  it('updates the order status through the full edit form', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(orderRoutes(), { route: '/orders/o-001/edit' });

    const orderNoInput = await screen.findByLabelText('订单号', {}, { timeout: 20_000 });
    expect((orderNoInput as HTMLInputElement).value).toMatch(/^SO-\d{4}-\d{4}$/);

    await chooseSelectOption(user, document, '状态', '已完成');
    await user.click(screen.getByRole('button', { name: '保存修改' }));

    expect(await screen.findByText('订单信息已更新', {}, { timeout: 20_000 })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: /订单 SO-\d{4}-1001/ }, { timeout: 20_000 }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('已完成').length).toBeGreaterThan(0);
  });
});
