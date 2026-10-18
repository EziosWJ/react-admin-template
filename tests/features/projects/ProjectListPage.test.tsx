import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import ProjectListPage from '../../../src/features/projects/ProjectListPage';
import { chooseSelectOption } from '../../utils/antd';
import { renderWithProviders } from '../../utils/renderWithProviders';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

describe('ProjectListPage', () => {
  it('loads projects, resolves customer names and syncs filters and sorting to the URL', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(
      <>
        <ProjectListPage />
        <LocationProbe />
      </>,
      { route: '/projects', path: '/projects' },
    );

    expect(await screen.findByText('优选门店数字化', {}, { timeout: 20_000 })).toBeInTheDocument();
    expect((await screen.findAllByText('星云科技')).length).toBeGreaterThan(0);

    await chooseSelectOption(user, document, '按项目状态筛选', '进行中');
    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toContain('status=in_progress');
    });

    await user.click(screen.getByRole('columnheader', { name: /预算/ }));
    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toContain('sortBy=budget');
      expect(screen.getByTestId('location').textContent).toContain('sortOrder=asc');
    });
  });
});
