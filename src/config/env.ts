function normalizeBasePath(value: string | undefined): string {
  const segment = (value ?? '/').trim().replace(/^\/+|\/+$/g, '');
  return segment ? '/' + segment : '/';
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function normalizeApiBaseUrl(value: string | undefined): string {
  const normalized = (value ?? '/api').trim().replace(/\/+$/, '');
  return normalized || '/api';
}

export const env = Object.freeze({
  basePath: normalizeBasePath(import.meta.env.VITE_BASE_PATH),
  apiBaseUrl: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  enableMsw: parseBoolean(import.meta.env.VITE_ENABLE_MSW, import.meta.env.DEV),
  isTest: import.meta.env.MODE === 'test',
  isDev: import.meta.env.DEV,
});

export function apiPath(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  if (/^https?:\/\//i.test(env.apiBaseUrl)) {
    return `${env.apiBaseUrl}${suffix}`;
  }
  const base = env.apiBaseUrl === '/' ? '' : env.apiBaseUrl;
  return `${base}${suffix}`;
}
