import { useEffect, useMemo, useState } from 'react';
import {
  Breadcrumb,
  Button,
  Drawer,
  Grid,
  Layout,
  Menu,
  Space,
  Tabs,
  Tooltip,
  Typography,
  type MenuProps,
} from 'antd';
import {
  Menu as MenuIcon,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
} from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { appConfig } from '../config/app.config';
import {
  findRouteDefinition,
  getActiveMenuPath,
  getBreadcrumbs,
  getTabKey,
  getTabLabel,
} from '../config/routeUtils';
import { menuRouteDefinitions, type AppRouteDefinition } from '../config/routes';
import { HOME_TAB, useTabsStore } from '../stores/useTabsStore';
import { useAppPreferences } from '../app/AppProviders';
import styles from './AppLayout.module.css';

const { Sider } = Layout;
const COLLAPSE_STORAGE_KEY = 'admin-sidebar-collapsed';

function toMenuItem(route: AppRouteDefinition): NonNullable<MenuProps['items']>[number] {
  const Icon = route.icon;
  return {
    key: route.path,
    icon: Icon ? <Icon size={17} strokeWidth={1.8} aria-hidden="true" /> : undefined,
    label: route.label,
  };
}

function buildMenuItems(): MenuProps['items'] {
  const items: NonNullable<MenuProps['items']> = [];
  menuRouteDefinitions.filter((route) => !route.group).forEach((route) => items.push(toMenuItem(route)));

  const groups = new Map<string, AppRouteDefinition[]>();
  menuRouteDefinitions
    .filter((route) => route.group)
    .forEach((route) => {
      const group = route.group!;
      const existing = groups.get(group) ?? [];
      existing.push(route);
      groups.set(group, existing);
    });

  groups.forEach((routes, group) => {
    items.push({
      type: 'group',
      key: `group-${group}`,
      label: group,
      children: routes.map(toMenuItem),
    });
  });
  return items;
}

export default function AppLayout() {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const location = useLocation();
  const navigate = useNavigate();
  const { themeMode, toggleTheme } = useAppPreferences();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = useTabsStore((state) => state.tabs);
  const openTab = useTabsStore((state) => state.openTab);
  const closeTab = useTabsStore((state) => state.closeTab);

  const activeMenuPath = getActiveMenuPath(location.pathname);
  const tabKey = getTabKey(location.pathname);
  const tabLabel = getTabLabel(location.pathname);
  const hasKnownRoute = Boolean(findRouteDefinition(location.pathname));
  const breadcrumbs = getBreadcrumbs(location.pathname);
  const menuItems = useMemo(buildMenuItems, []);
  const displayTabs =
    !hasKnownRoute || tabs.some((tab) => tab.key === tabKey)
      ? tabs
      : [
          ...tabs,
          {
            key: tabKey,
            label: tabLabel,
            href: `${location.pathname}${location.search}`,
            closable: tabKey !== '/',
          },
        ];

  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, String(collapsed));
    } catch {
      // 忽略存储异常，折叠状态仍在本会话内生效。
    }
  }, [collapsed]);

  useEffect(() => {
    if (!hasKnownRoute) return;
    openTab({
      key: tabKey,
      label: tabLabel,
      href: `${location.pathname}${location.search}`,
      closable: tabKey !== '/',
    });
  }, [hasKnownRoute, location.pathname, location.search, openTab, tabKey, tabLabel]);

  useEffect(() => {
    document.title = `${hasKnownRoute ? tabLabel : '页面未找到'} · ${appConfig.name}`;
  }, [hasKnownRoute, tabLabel]);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
    setMobileMenuOpen(false);
  };

  const handleCloseTab = (targetKey: string) => {
    const index = displayTabs.findIndex((tab) => tab.key === targetKey);
    const closingActive = targetKey === tabKey;
    if (closingActive) {
      const fallback = displayTabs[index - 1] ?? displayTabs[index + 1] ?? HOME_TAB;
      closeTab(targetKey);
      navigate(fallback.href);
    } else {
      closeTab(targetKey);
    }
  };

  const menu = (
    <Menu
      mode="inline"
      theme={themeMode}
      selectedKeys={[activeMenuPath]}
      items={menuItems}
      onClick={handleMenuClick}
      className={styles.sideMenu}
      aria-label="主导航"
    />
  );

  const collapseButton = (
    <Tooltip title={collapsed ? '展开侧边栏' : '折叠侧边栏'}>
      <Button
        type="text"
        size="small"
        aria-label={collapsed ? '展开侧边栏' : '折叠侧边栏'}
        icon={collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        onClick={() => setCollapsed((value) => !value)}
      />
    </Tooltip>
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
            {!collapsed && collapseButton}
          </div>
          {collapsed && <div className={styles.collapsedToggle}>{collapseButton}</div>}
          {menu}
          {!collapsed && <div className={styles.sidebarFoot}>{appConfig.sidebarCaption}</div>}
        </Sider>
      )}

      <Layout className={styles.main}>
        <div className={styles.stickyTop}>
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
              {isMobile && <span className={styles.mobileBrandMark}>{appConfig.logoText}</span>}
              <Breadcrumb
                className={styles.breadcrumb}
                items={breadcrumbs.map((item, index) => ({
                  title:
                    item.href && index < breadcrumbs.length - 1 ? (
                      <Link to={item.href}>{item.label}</Link>
                    ) : (
                      item.label
                    ),
                }))}
              />
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

          <div className={styles.tabBar}>
            <Tabs
              type="editable-card"
              hideAdd
              size="small"
              activeKey={tabKey}
              onChange={(key) => {
                const tab = tabs.find((item) => item.key === key);
                if (tab) navigate(tab.href);
              }}
              onEdit={(targetKey, action) => {
                if (action === 'remove') handleCloseTab(String(targetKey));
              }}
              items={displayTabs.map((tab) => ({
                key: tab.key,
                label: tab.label,
                closable: tab.closable,
              }))}
              className={styles.tabs}
              aria-label="已打开的页面"
            />
            <Typography.Text type="secondary" className={styles.tabHint}>
              页面标签保存在当前浏览器会话中
            </Typography.Text>
          </div>
        </div>

        <main className={styles.content}>
          <Outlet />
        </main>
        <footer className={styles.footer}>{appConfig.footerText}</footer>
      </Layout>

      <Drawer
        title={appConfig.name}
        placement="left"
        open={isMobile && mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        size={280}
        styles={{ body: { padding: 8 } }}
      >
        {menu}
      </Drawer>
    </Layout>
  );
}
