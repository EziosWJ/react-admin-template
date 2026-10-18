import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProviders, useAppPreferences } from '../../src/app/AppProviders';
import { createTestQueryClient } from '../utils/renderWithProviders';

function ThemeProbe() {
  const { themeMode, toggleTheme } = useAppPreferences();
  return (
    <div>
      <span data-testid="theme-mode">{themeMode}</span>
      <button type="button" onClick={toggleTheme}>
        切换主题
      </button>
    </div>
  );
}

function mockSystemTheme(matches: boolean) {
  return vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
    matches: query.includes('prefers-color-scheme: dark') ? matches : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function renderProbe() {
  return render(
    <AppProviders client={createTestQueryClient()}>
      <ThemeProbe />
    </AppProviders>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('theme preferences', () => {
  it('follows the operating system theme on first visit', () => {
    mockSystemTheme(true);
    renderProbe();

    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('restores a saved manual preference over the system theme', () => {
    mockSystemTheme(true);
    window.localStorage.setItem('app-theme', 'light');
    renderProbe();

    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('persists manual toggles and reuses them on the next mount', async () => {
    mockSystemTheme(false);
    const user = userEvent.setup();
    const first = renderProbe();

    await user.click(screen.getByRole('button', { name: '切换主题' }));
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
    expect(window.localStorage.getItem('app-theme')).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    first.unmount();
    renderProbe();
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
  });

  it('ignores later OS theme changes after a manual preference is saved', async () => {
    let listener: ((event: MediaQueryListEvent) => void) | undefined;
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_type: string, callback: EventListenerOrEventListenerObject) => {
        listener = callback as (event: MediaQueryListEvent) => void;
      },
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const user = userEvent.setup();
    renderProbe();
    await user.click(screen.getByRole('button', { name: '切换主题' }));
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');

    act(() => {
      listener?.({ matches: false } as MediaQueryListEvent);
    });
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
  });
});
