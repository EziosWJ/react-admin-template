import { lazy, Suspense } from 'react';
import { Button, Result, Spin } from 'antd';
import { createBrowserRouter, RouterProvider, isRouteErrorResponse, useNavigate, useRouteError, type RouteObject } from 'react-router-dom';
import { env } from '../config/env';
import { routeDefinitions } from '../config/routes';
import AppLayout from '../layouts/AppLayout';

const NotFoundPage = lazy(() => import('../pages/PlaceholderPage').then(({ default: Page }) => ({
  default: () => <Page title="页面未找到" description="当前地址没有对应的页面，请从导航中选择有效入口。" />,
})));

function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const status = isRouteErrorResponse(error) ? error.status : 500;
  const notFound = status === 404;

  return (
    <Result
      status={notFound ? '404' : '500'}
      title={notFound ? '页面不存在' : '页面加载失败'}
      subTitle={notFound ? '请检查地址，或返回应用首页。' : '页面遇到问题。请重试或返回首页；生产环境不会展示内部堆栈。'}
      extra={<Button type="primary" onClick={() => navigate('/')}>返回首页</Button>}
    />
  );
}

const children: RouteObject[] = routeDefinitions.map((route) => {
  const Page = route.component;
  const element = (
    <Suspense fallback={<div className="routeLoading"><Spin size="large" /><span>页面加载中…</span></div>}>
      <Page />
    </Suspense>
  );
  const handle = { title: route.title, breadcrumb: route.label };

  return route.path === '/'
    ? { index: true, element, handle }
    : { path: route.path.replace(/^\//, ''), element, handle };
});

const router = createBrowserRouter(
  [{
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [...children, { path: '*', element: <Suspense fallback={<div className="routeLoading"><Spin size="large" /></div>}><NotFoundPage /></Suspense> }],
  }],
  { basename: env.basePath === '/' ? undefined : env.basePath },
);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
