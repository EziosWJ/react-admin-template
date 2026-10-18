import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { Route, Routes } from 'react-router-dom';
import ProjectDetailPage from '../../../src/features/projects/ProjectDetailPage';
import ProjectEditPage from '../../../src/features/projects/ProjectEditPage';
import { server } from '../../mocks/server';
import { renderWithProviders } from '../../utils/renderWithProviders';
import { setFieldValue } from '../../utils/antd';

function projectRoutes() {
  return (
    <Routes>
      <Route path="/projects/:id" element={<ProjectDetailPage />} />
      <Route path="/projects/:id/edit" element={<ProjectEditPage />} />
    </Routes>
  );
}

describe('ProjectDetailPage and ProjectEditPage', () => {
  it('shows the linked customer and related orders', async () => {
    renderWithProviders(projectRoutes(), { route: '/projects/p-009' });

    expect(
      await screen.findByRole('heading', { name: '云帆增长分析平台' }, { timeout: 20_000 }),
    ).toBeInTheDocument();
    const customerLinks = await screen.findAllByRole('link', { name: '云帆互联网' });
    expect(customerLinks.length).toBeGreaterThan(0);
    expect(customerLinks[0]).toHaveAttribute('href', '/customers/c-009');
    expect(await screen.findAllByText(/^SO-\d{4}-\d{4}$/)).not.toHaveLength(0);
  });

  it('degrades gracefully when the linked customer no longer exists', async () => {
    server.use(
      http.get('*/api/customers/c-001', () =>
        HttpResponse.json({ message: '客户不存在或已被删除。' }, { status: 404 }),
      ),
    );
    renderWithProviders(projectRoutes(), { route: '/projects/p-001' });

    await screen.findByRole('heading', { name: '星云数据中台建设' }, { timeout: 20_000 });
    expect(
      await screen.findByText('关联客户不存在或已被删除，项目数据仍可查看但无法跳转。'),
    ).toBeInTheDocument();
  });

  it('updates a project through the full edit form and refreshes the detail view', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(projectRoutes(), { route: '/projects/p-001/edit' });

    const nameInput = await screen.findByLabelText('项目名称', {}, { timeout: 20_000 });
    expect(nameInput).toHaveValue('星云数据中台建设');
    setFieldValue('项目名称', '星云数据中台建设（二期）');
    await user.click(screen.getByRole('button', { name: '保存修改' }));

    expect(await screen.findByText('项目信息已更新', {}, { timeout: 20_000 })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: '星云数据中台建设（二期）' }, { timeout: 20_000 }),
    ).toBeInTheDocument();
  });
});
