function normalizeBasePath(value: string | undefined): string {
  const segment = (value ?? '/').trim().replace(/^\/+|\/+$/g, '');
  return segment ? '/' + segment : '/';
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

export const env = Object.freeze({
  basePath: normalizeBasePath(import.meta.env.VITE_BASE_PATH),
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL?.trim() || '/api',
  enableMsw: parseBoolean(import.meta.env.VITE_ENABLE_MSW, import.meta.env.DEV),
});
