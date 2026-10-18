import { useEffect, useState } from 'react';
import {
  Breadcrumb,
  Button,
  Drawer,
  Layout,
  Menu,
  Space,
  Tooltip,
  Typography,
  Grid,
  type MenuProps,
} from 'antd';
import { Menu as MenuIcon, Moon, Sun, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Outlet, useLocation, useMatches, useNavigate } from 'react-router-dom';
import { appConfig } from '../config/app.config';
import { routeDefinitions } from '../config/routes';
import { useAppPreferences } from '../app/AppProviders';
import styles from './AppLayout.module.css';

const { Sider } = Layout;

export default function AppLayout() {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const location = useLocation();
  const matches = useMatches();
  const navigate = useNavigate();
  const { themeMode, toggleTheme } = useAppPreferences();
  const [collapsed, setCollapsed] = useState(() => window.localStorage.getItem('admin-sidebar-collapsed') === 'true');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem('admin-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const currentRoute = [...routeDefinitions]
    .filter((route) => route.path === '/' ? location.pathname === '/' : location.pathname.startsWith(route.path))
    .sort((left, right) => right.path.length - left.path.length)[0];
  const matchedHandle = [...matches].reverse().map((match) => match.handle as { title?: string; breadcrumb?: string } | undefined).find((handle) => handle?.title);
  const pageTitle = matchedHandle?.title ?? currentRoute?.title ?? '页面';
  const activePath = currentRoute?.path ?? '/';

  const menuItems: MenuProps['items'] = routeDefinitions.map((route) => ({
    key: route.path,
    icon: <route.icon size={17} strokeWidth={1.8} aria-hidden="true" />,
    label: route.label,
  }));

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
    setMobileMenuOpen(false);
  };

  const menu = (
    <Menu
      mode="inline"
      selectedKeys={[activePath]}
      items={menuItems}
      onClick={handleMenuClick}
      className={styles.sideMenu}
      aria-label="主导航"
    />
  );

  return (
    <Layout className={styles.shell}>
      {!isMobile && (
        <Sider
          width={248}
          collapsedWidth={76}
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme={themeMode}
          className={styles.sider}
          trigger={null}
        >
          <div className={styles.brand}>
            <span className={styles.brandMark}>{appConfig.logoText}</span>
            {!collapsed && <span className={styles.brandName}>{appConfig.name}</span>}
            <Tooltip title={collapsed ? '展开侧边栏' : '折叠侧边栏'}>
              <Button
                type="text"
                size="small"
                aria-label={collapsed ? '展开侧边栏' : '折叠侧边栏'}
                icon={collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
                onClick={() => setCollapsed((value) => !value)}
              />
            </Tooltip>
          </div>
          {menu}
          {!collapsed && <div className={styles.sidebarFoot}>{appConfig.sidebarCaption}</div>}
        </Sider>
      )}

      <Layout className={styles.main}>
        <header className={styles.header}>
          <div className={styles.heading}>
            {isMobile && (
              <Button
                type="text"
                aria-label="打开导航菜单"
                icon={<MenuIcon size={20} />}
                onClick={() => setMobileMenuOpen(true)}
              />
            )}
            <div>
              <Typography.Title level={4} className={styles.pageTitle}>{pageTitle}</Typography.Title>
              <Breadcrumb items={[{ title: appConfig.name }, { title: currentRoute?.label ?? '页面' }]} />
            </div>
          </div>
          <Space size="small">
            <Tooltip title={themeMode === 'dark' ? '切换浅色主题' : '切换深色主题'}>
              <Button
                type="text"
                aria-label={themeMode === 'dark' ? '切换浅色主题' : '切换深色主题'}
                icon={themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                onClick={toggleTheme}
              />
            </Tooltip>
          </Space>
        </header>
        <main className={styles.content}><Outlet /></main>
        <footer className={styles.footer}>{appConfig.footerText}</footer>
      </Layout>

      <Drawer
        title={appConfig.name}
        placement="left"
        open={isMobile && mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        width={280}
        styles={{ body: { padding: 8 } }}
      >
        {menu}
      </Drawer>
    </Layout>
  );
}
