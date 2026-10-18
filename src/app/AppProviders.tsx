import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { App as AntApp, ConfigProvider, theme as antdTheme, type ThemeConfig } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { appConfig } from '../config/app.config';

export type ThemeMode = 'light' | 'dark';

interface AppPreferences {
  themeMode: ThemeMode;
  toggleTheme: () => void;
}

const PreferencesContext = createContext<AppPreferences | null>(null);

function getInitialTheme(): ThemeMode {
  const stored = window.localStorage.getItem('app-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 300_000,
      retry: (failureCount, error) => {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (status !== undefined && status >= 400 && status < 500) return false;
        }
        return failureCount < 1;
      },
    },
    mutations: { retry: false },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    if (window.localStorage.getItem('app-theme')) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => setThemeMode(event.matches ? 'dark' : 'light');
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem('app-theme', next);
      return next;
    });
  }, []);

  const preferences = useMemo(() => ({ themeMode, toggleTheme }), [themeMode, toggleTheme]);
  const themeConfig: ThemeConfig = {
    algorithm: themeMode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: { colorPrimary: appConfig.brandColor, borderRadius: 8 },
  };

  return (
    <PreferencesContext.Provider value={preferences}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider locale={zhCN} theme={themeConfig}>
          <AntApp>{children}</AntApp>
        </ConfigProvider>
      </QueryClientProvider>
    </PreferencesContext.Provider>
  );
}

export function useAppPreferences(): AppPreferences {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('useAppPreferences must be used within AppProviders');
  return value;
}
