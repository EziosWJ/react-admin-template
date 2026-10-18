import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import OrderListPage from '../../../src/features/orders/OrderListPage';
import { chooseSelectOption } from '../../utils/antd';
import { renderWithProviders } from '../../utils/renderWithProviders';
import { setFieldValue } from '../../utils/antd';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

describe('OrderListPage', () => {
  it('loads orders and syncs status filters to the URL', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(
      <>
        <OrderListPage />
        <LocationProbe />
      </>,
      { route: '/orders', path: '/orders' },
    );

    expect((await screen.findAllByText(/^SO-\d{4}-\d{4}$/, {}, { timeout: 20_000 })).length).toBeGreaterThan(0);

    await chooseSelectOption(user, document, '按订单状态筛选', '待处理');
    expect(screen.getByTestId('location').textContent).not.toContain('status=pending');
    await user.click(screen.getByRole('button', { name: '查询' }));
    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toContain('status=pending');
    });
    expect((await screen.findAllByText('待处理')).length).toBeGreaterThan(0);
  });

  it('creates a draft order through the drawer, generating its order number', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<OrderListPage />, { route: '/orders', path: '/orders' });
    await screen.findAllByText(/^SO-\d{4}-\d{4}$/, {}, { timeout: 20_000 });

    await user.click(screen.getByRole('button', { name: '新建订单' }));
    const drawer = await screen.findByRole('dialog');

    await chooseSelectOption(user, drawer, '客户', '星云科技（CUS-1001）', '星云科技');
    setFieldValue('金额', '54321', drawer);
    await user.click(within(drawer).getByRole('button', { name: '创建订单' }));

    expect(await screen.findByText('订单创建成功', {}, { timeout: 20_000 })).toBeInTheDocument();

    setFieldValue('搜索订单', '星云科技');
    await user.click(screen.getByRole('button', { name: '查询' }));
    expect(await screen.findByText('¥54,321.00', {}, { timeout: 20_000 })).toBeInTheDocument();
  });
});
