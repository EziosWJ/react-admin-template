import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { useLocation } from 'react-router-dom';
import DashboardPage from '../../../src/features/dashboard/DashboardPage';
import { server } from '../../mocks/server';
import { renderWithProviders } from '../../utils/renderWithProviders';

vi.mock('@ant-design/charts', () => ({
  Pie: () => <div data-testid="project-status-chart" />,
  Line: () => <div data-testid="order-trend-chart" />,
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

describe('DashboardPage', () => {
  it('renders metrics and charts from the shared API and links KPIs to filtered lists', async () => {
    renderWithProviders(
      <>
        <DashboardPage />
        <LocationProbe />
      </>,
      { route: '/' },
    );

    expect(await screen.findByText('客户总量')).toBeInTheDocument();
    expect(screen.getByText('进行中项目')).toBeInTheDocument();
    expect(screen.getByText('待处理订单')).toBeInTheDocument();
    expect(screen.getByText('启用用户')).toBeInTheDocument();
    expect(await screen.findByTestId('project-status-chart')).toBeInTheDocument();
    expect(await screen.findByTestId('order-trend-chart')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /进行中项目/ })).toHaveAttribute(
      'href',
      '/projects?status=in_progress',
    );
    expect(screen.getByRole('link', { name: /待处理订单/ })).toHaveAttribute(
      'href',
      '/orders?status=pending',
    );
  });

  it('switches the chart range through the URL', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <DashboardPage />
        <LocationProbe />
      </>,
      { route: '/' },
    );

    await screen.findByText('客户总量');
    await user.click(screen.getByText('近 90 天'));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('range=90d');
    });
    expect(await screen.findByTestId('order-trend-chart')).toBeInTheDocument();
  });

  it('shows an error state with retry when the summary request fails', async () => {
    server.use(
      http.get('*/api/dashboard', () =>
        HttpResponse.json({ message: '仪表盘暂时不可用。' }, { status: 500 }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />, { route: '/' });

    expect(await screen.findByText('数据加载失败')).toBeInTheDocument();
    expect(screen.getByText('仪表盘暂时不可用。')).toBeInTheDocument();

    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: '重新加载' }));

    expect(await screen.findByText('客户总量')).toBeInTheDocument();
  });
});
