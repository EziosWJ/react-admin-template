import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../../src/pages/DashboardPage';

describe('DashboardPage', () => {
  it('explains that this commit establishes the framework, not fake business metrics', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: '基础框架已就绪' })).toBeInTheDocument();
    expect(screen.getByText(/不使用伪造的业务统计数据/)).toBeInTheDocument();
  });
});
