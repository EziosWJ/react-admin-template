import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import {
  BriefcaseBusiness,
  ClipboardList,
  LayoutDashboard,
  UserRoundCog,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { paths } from './paths';

export interface AppRouteDefinition {
  path: string;
  label: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  group?: string;
  hideInMenu?: boolean;
  parentPath?: string;
  component: LazyExoticComponent<ComponentType>;
}

export const routeDefinitions: AppRouteDefinition[] = [
  {
    path: paths.dashboard,
    label: '仪表盘',
    title: '经营总览',
    description: '关键经营指标与趋势图表。',
    icon: LayoutDashboard,
    component: lazy(() => import('../features/dashboard/DashboardPage')),
  },
  {
    path: paths.customers,
    label: '客户管理',
    title: '客户管理',
    description: '客户主数据与关联业务。',
    icon: Users,
    group: '业务管理',
    component: lazy(() => import('../features/customers/CustomerListPage')),
  },
  {
    path: `${paths.customers}/:id`,
    label: '客户详情',
    title: '客户详情',
    hideInMenu: true,
    parentPath: paths.customers,
    component: lazy(() => import('../features/customers/CustomerDetailPage')),
  },
  {
    path: `${paths.customers}/:id/edit`,
    label: '编辑客户',
    title: '编辑客户',
    hideInMenu: true,
    parentPath: `${paths.customers}/:id`,
    component: lazy(() => import('../features/customers/CustomerEditPage')),
  },
  {
    path: paths.projects,
    label: '项目管理',
    title: '项目管理',
    description: '项目进度、预算与客户关联。',
    icon: BriefcaseBusiness,
    group: '业务管理',
    component: lazy(() => import('../features/projects/ProjectListPage')),
  },
  {
    path: `${paths.projects}/:id`,
    label: '项目详情',
    title: '项目详情',
    hideInMenu: true,
    parentPath: paths.projects,
    component: lazy(() => import('../features/projects/ProjectDetailPage')),
  },
  {
    path: `${paths.projects}/:id/edit`,
    label: '编辑项目',
    title: '编辑项目',
    hideInMenu: true,
    parentPath: `${paths.projects}/:id`,
    component: lazy(() => import('../features/projects/ProjectEditPage')),
  },
  {
    path: paths.orders,
    label: '订单管理',
    title: '订单管理',
    description: '订单状态、金额与客户/项目关联。',
    icon: ClipboardList,
    group: '业务管理',
    component: lazy(() => import('../features/orders/OrderListPage')),
  },
  {
    path: `${paths.orders}/:id`,
    label: '订单详情',
    title: '订单详情',
    hideInMenu: true,
    parentPath: paths.orders,
    component: lazy(() => import('../features/orders/OrderDetailPage')),
  },
  {
    path: `${paths.orders}/:id/edit`,
    label: '编辑订单',
    title: '编辑订单',
    hideInMenu: true,
    parentPath: `${paths.orders}/:id`,
    component: lazy(() => import('../features/orders/OrderEditPage')),
  },
  {
    path: paths.users,
    label: '用户管理',
    title: '用户管理',
    description: '业务用户资料、部门与岗位。',
    icon: UserRoundCog,
    group: '系统管理',
    component: lazy(() => import('../features/users/UserListPage')),
  },
  {
    path: `${paths.users}/:id`,
    label: '用户详情',
    title: '用户详情',
    hideInMenu: true,
    parentPath: paths.users,
    component: lazy(() => import('../features/users/UserDetailPage')),
  },
  {
    path: `${paths.users}/:id/edit`,
    label: '编辑用户',
    title: '编辑用户',
    hideInMenu: true,
    parentPath: `${paths.users}/:id`,
    component: lazy(() => import('../features/users/UserEditPage')),
  },
];

export const menuRouteDefinitions = routeDefinitions.filter((route) => !route.hideInMenu && route.icon);
