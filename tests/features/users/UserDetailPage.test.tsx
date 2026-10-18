import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import UserDetailPage from '../../../src/features/users/UserDetailPage';
import { renderWithProviders } from '../../utils/renderWithProviders';

function userRoutes() {
  return (
    <Routes>
      <Route path="/users/:id" element={<UserDetailPage />} />
    </Routes>
  );
}

describe('UserDetailPage', () => {
  it('shows user data and clearly states that no authentication exists', async () => {
    renderWithProviders(userRoutes(), { route: '/users/u-001' });

    expect(await screen.findByRole('heading', { name: '陈晨' }, { timeout: 20_000 })).toBeInTheDocument();
    expect(screen.getByText('chenchen')).toBeInTheDocument();
    expect(screen.getByText('产品研发部')).toBeInTheDocument();
    expect(screen.getByText(/不包含密码、登录认证或权限配置/)).toBeInTheDocument();
  });
});
