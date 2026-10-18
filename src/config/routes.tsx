import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import {
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  ClipboardList,
  UserRoundCog,
  type LucideIcon,
} from 'lucide-react';

export interface AppRouteDefinition {
  path: string;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  group?: string;
  component: LazyExoticComponent<ComponentType>;
}

const placeholder = (title: string, description: string) =>
  lazy(() =>
    import('../pages/PlaceholderPage').then(({ default: Page }) => ({
      default: () => <Page title={title} description={description} />,
    })),
  );

export const routeDefinitions: AppRouteDefinition[] = [
  {
    path: '/',
    label: '仪表盘',
    title: '经营总览',
    description: '查看应用概况与后续实施路线。',
    icon: LayoutDashboard,
    component: lazy(() => import('../pages/DashboardPage')),
  },
  {
    path: '/customers',
    label: '客户管理',
    title: '客户管理',
    description: '客户列表、客户详情与客户信息维护将在客户管理 Issue 中实现。',
    icon: Users,
    group: '业务管理',
    component: placeholder('客户管理', '客户列表、客户详情与客户信息维护将在客户管理 Issue 中实现。'),
  },
  {
    path: '/projects',
    label: '项目管理',
    title: '项目管理',
    description: '项目 CRUD、客户关联和进度展示将在项目管理 Issue 中实现。',
    icon: BriefcaseBusiness,
    group: '业务管理',
    component: placeholder('项目管理', '项目 CRUD、客户关联和进度展示将在项目管理 Issue 中实现。'),
  },
  {
    path: '/orders',
    label: '订单管理',
    title: '订单管理',
    description: '订单 CRUD、状态展示和客户/项目关联将在订单管理 Issue 中实现。',
    icon: ClipboardList,
    group: '业务管理',
    component: placeholder('订单管理', '订单 CRUD、状态展示和客户/项目关联将在订单管理 Issue 中实现。'),
  },
  {
    path: '/users',
    label: '用户管理',
    title: '用户管理',
    description: '业务用户资料、部门、岗位和状态管理将在用户管理 Issue 中实现。',
    icon: UserRoundCog,
    group: '系统管理',
    component: placeholder('用户管理', '业务用户资料、部门、岗位和状态管理将在用户管理 Issue 中实现。'),
  },
];
