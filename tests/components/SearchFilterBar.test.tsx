import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from 'antd';
import { SearchFilterBar } from '../../src/components/SearchFilterBar';
import { renderWithProviders } from '../utils/renderWithProviders';

describe('SearchFilterBar', () => {
  it('submits explicitly and resets through dedicated buttons', async () => {
    const user = userEvent.setup({ delay: null });
    const onSubmit = vi.fn();
    const onReset = vi.fn();

    renderWithProviders(
      <SearchFilterBar onSubmit={onSubmit} onReset={onReset} dirty>
        <Input aria-label="关键词" />
      </SearchFilterBar>,
    );

    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByText('条件已修改，点击查询生效')).toBeInTheDocument();

    await user.type(screen.getByLabelText('关键词'), '测试');
    expect(onSubmit).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '查询' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: '重置' }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('supports Enter-to-submit form semantics', async () => {
    const user = userEvent.setup({ delay: null });
    const onSubmit = vi.fn();
    renderWithProviders(
      <SearchFilterBar onSubmit={onSubmit} onReset={vi.fn()}>
        <Input aria-label="关键词" />
      </SearchFilterBar>,
    );

    await user.type(screen.getByLabelText('关键词'), 'enter{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
