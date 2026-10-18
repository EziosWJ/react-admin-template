# ADR-0001：技术栈

状态：Accepted。日期：2026-10-18。

## 背景
模板需要提供稳定、可复制、适合 Agent 持续修改的 React 企业业务后台基线，两个仓库的核心技术栈保持一致。

## 决策
- React 19.3 + TypeScript。
- Vite 构建，pnpm 管理依赖。
- Ant Design 6；CSS Modules + Ant Design Design Token。
- React Router Data Router；页面按当前实现使用 lazy loading 与 Suspense。
- TanStack Query 5 管理服务端数据和缓存。
- Axios 作为统一 HTTP 客户端。
- Zustand 仅用于必要的跨组件客户端状态。
- MSW 2 提供模拟 API。
- Lucide React 图标；Ant Design Charts 图表。
- Day.js 日期；ExcelJS 生成 XLSX，CSV 使用独立轻量工具。
- Vitest、React Testing Library、V8 coverage 和包含 jsx-a11y 的 ESLint。

## 后果
不引入 Tailwind、第二套图标库或 Storybook。技术选择变更必须先更新 ADR 并评估兼容性、迁移成本与测试影响。依赖更新必须提交 pnpm-lock.yaml。
