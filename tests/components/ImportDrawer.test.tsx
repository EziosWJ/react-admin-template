import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportDrawer } from '../../src/components/ImportDrawer';
import { renderWithProviders } from '../utils/renderWithProviders';

function renderDrawer() {
  return renderWithProviders(<ImportDrawer open onClose={vi.fn()} moduleLabel="客户" />);
}

async function uploadFile(): Promise<HTMLInputElement> {
  const input = await waitFor(() => {
    const element = document.querySelector('input[type="file"]');
    if (!element) throw new Error('upload input not found');
    return element as HTMLInputElement;
  });
  return input;
}

describe('ImportDrawer simulated upload', () => {
  it('validates, simulates progress and reports the parsed CSV row count without writing data', async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderDrawer();

    const file = new File(['姓名,邮箱\nAlice,a@example.com\nBob,b@example.com'], 'customers.csv', {
      type: 'text/csv',
    });
    await user.upload(await uploadFile(), file);

    expect(await screen.findByText('模拟上传完成', {}, { timeout: 20_000 })).toBeInTheDocument();
    expect(screen.getByText(/已读取 2 行数据/)).toBeInTheDocument();
    expect(screen.getByText(/文件未写入后端/)).toBeInTheDocument();
  });

  it('rejects unsupported file types before starting the simulation', async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderDrawer();

    const file = new File(['not supported'], 'customers.txt', { type: 'text/plain' });
    await user.upload(await uploadFile(), file);

    expect(await screen.findByText(/仅支持 .csv、.xlsx 格式的文件/)).toBeInTheDocument();
    expect(screen.queryByText('模拟上传完成')).not.toBeInTheDocument();
  });

  it('exposes a controllable failure state and a retry action', async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderDrawer();

    await user.click(screen.getByRole('checkbox', { name: /模拟上传失败/ }));
    const file = new File(['姓名\nAlice'], 'customers.csv', { type: 'text/csv' });
    await user.upload(await uploadFile(), file);

    expect(await screen.findByText('模拟上传失败', {}, { timeout: 20_000 })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument();
    });
  });
});
