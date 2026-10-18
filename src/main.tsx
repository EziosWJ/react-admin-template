import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css';
import './styles/global.css';
import { AppProviders } from './app/AppProviders';
import { AppRouter } from './app/router';
import { env } from './config/env';

async function startMocking(): Promise<void> {
  if (!env.enableMsw) return;
  const { worker } = await import('./mocks/browser');
  const workerUrl = `${env.basePath === '/' ? '' : env.basePath}/mockServiceWorker.js`;
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: workerUrl },
  });
}

function renderApp(): void {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </React.StrictMode>,
  );
}

async function bootstrap(): Promise<void> {
  const mocking = startMocking().catch((error: unknown) => {
    console.error('[MSW] 模拟服务启动失败，页面仍会加载，但业务请求可能失败。', error);
  });
  // 若浏览器环境迟迟无法完成 Service Worker 注册，也先渲染应用，避免白屏。
  await Promise.race([
    mocking,
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, 5000);
    }),
  ]);
  renderApp();
}

void bootstrap();
