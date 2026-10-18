import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { Spin } from 'antd';
import { createBrowserRouter, RouterProvider, type RouteObject } from 'react-router-dom';
import { env } from '../config/env';
import { routeDefinitions, type AppRouteDefinition } from '../config/routes';
import AppLayout from '../layouts/AppLayout';

const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const RouteErrorPage = lazy(() => import('../pages/RouteErrorPage'));

function PageFallback() {
  return (
    <div className="routeLoading" aria-live="polite" aria-busy="true">
      <Spin size="large" />
      <span>页面加载中…</span>
    </div>
  );
}

function lazyElement(Component: ComponentType): ReactNode {
  return (
    <Suspense fallback={<PageFallback />}>
      <Component />
    </Suspense>
  );
}

function toRouteObject(definition: AppRouteDefinition): RouteObject {
  const element = lazyElement(definition.component);
  if (definition.path === '/') {
    return { index: true, element };
  }
  return {
    path: definition.path.replace(/^\//, ''),
    element,
    handle: { title: definition.title, label: definition.label },
  };
}

export function createAppRouter() {
  return createBrowserRouter(
    [
      {
        path: '/',
        element: <AppLayout />,
        errorElement: lazyElement(RouteErrorPage),
        children: [
          ...routeDefinitions.map(toRouteObject),
          { path: '*', element: lazyElement(NotFoundPage) },
        ],
      },
    ],
    { basename: env.basePath === '/' ? undefined : env.basePath },
  );
}

const appRouter = createAppRouter();

export function AppRouter() {
  return <RouterProvider router={appRouter} />;
}
