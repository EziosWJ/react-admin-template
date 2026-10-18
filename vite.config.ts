import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function normalizeBasePath(value: string): string {
  const segment = value.trim().replace(/^\/+|\/+$/g, '');
  return segment ? '/' + segment + '/' : '/';
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: normalizeBasePath(env.VITE_BASE_PATH || '/'),
    plugins: [react()],
    server: { host: '0.0.0.0' },
    preview: { host: '0.0.0.0' },
  };
});
