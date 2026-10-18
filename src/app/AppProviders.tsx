import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { App as AntApp, ConfigProvider, theme as antdTheme, type ThemeConfig } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { appConfig } from '../config/app.config';
import { queryClient as defaultQueryClient } from '../lib/queryClient';
import { AppErrorBoundary } from './AppErrorBoundary';

export type ThemeMode = 'light' | 'dark';

interface AppPreferences {
  themeMode: ThemeMode;
  toggleTheme: () => void;
}

const PreferencesContext = createContext<AppPreferences | null>(null);
const THEME_STORAGE_KEY = 'app-theme';

function getSystemTheme(): ThemeMode {
  const media = window.matchMedia?.('(prefers-color-scheme: dark)');
  return media?.matches ? 'dark' : 'light';
}

function getStoredTheme(): ThemeMode | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

function getInitialTheme(): ThemeMode {
  return getStoredTheme() ?? getSystemTheme();
}

interface AppProvidersProps {
  children: ReactNode;
  client?: QueryClient;
}

export function AppProviders({ children, client = defaultQueryClient }: AppProvidersProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    if (getStoredTheme() || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => {
      if (!getStoredTheme()) setThemeMode(event.matches ? 'dark' : 'light');
    };
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.style.colorScheme = themeMode;
  }, [themeMode]);

  const toggleTheme = useCallback(() => {
    setThemeMode((current) => {
      const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // 存储不可用时仍允许本次会话切换主题。
      }
      return next;
    });
  }, []);

  const preferences = useMemo(() => ({ themeMode, toggleTheme }), [themeMode, toggleTheme]);

  const themeConfig: ThemeConfig = useMemo(
    () => ({
      algorithm: themeMode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      cssVar: { prefix: 'ant' },
      token: {
        colorPrimary: appConfig.brandColor,
        borderRadius: 8,
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
        colorBgLayout: themeMode === 'dark' ? '#0b1220' : '#f4f7fb',
      },
      components: {
        Layout: {
          headerBg: themeMode === 'dark' ? '#111827' : '#ffffff',
          siderBg: themeMode === 'dark' ? '#0f172a' : '#ffffff',
          bodyBg: themeMode === 'dark' ? '#0b1220' : '#f4f7fb',
          footerBg: 'transparent',
        },
        Menu: {
          itemBorderRadius: 8,
          itemMarginInline: 8,
        },
        Table: {
          headerBg: themeMode === 'dark' ? '#141d2e' : '#f7f9fc',
        },
        Card: {
          borderRadiusLG: 14,
        },
      },
    }),
    [themeMode],
  );

  return (
    <PreferencesContext.Provider value={preferences}>
      <QueryClientProvider client={client}>
        <ConfigProvider locale={zhCN} theme={themeConfig} button={{ autoInsertSpace: false }}>
          <AntApp>
            <AppErrorBoundary>{children}</AppErrorBoundary>
          </AntApp>
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
