# React Admin Template

面向企业业务系统的侧边栏管理后台脚手架

## 技术栈

React 19.3、TypeScript、Vite、Ant Design 6、React Router Data Router、TanStack Query、Axios、Zustand、MSW、Lucide React、Ant Design Charts、Day.js、ExcelJS、Vitest 和 React Testing Library。

## 本地启动

1. 安装 Node.js 22.12 或更新版本以及 pnpm 10。
2. 执行 pnpm install。
3. 将 .env.example 复制为 .env.local，并按需修改环境变量。
4. 执行 pnpm dev，然后打开终端显示的本地地址。

仓库已提交 pnpm-lock.yaml。依赖安装使用 pnpm install --frozen-lockfile；依赖变更后需审查并提交锁文件更新。

## 常用命令

- pnpm dev：启动开发服务器。
- pnpm build：类型检查并构建生产静态资源。
- pnpm preview：预览生产构建。
- pnpm lint：运行 ESLint。
- pnpm typecheck：执行 TypeScript 项目检查。
- pnpm test：运行 Vitest。
- pnpm test:coverage：生成测试覆盖率报告。

## 项目范围

本仓库提供 侧边栏管理后台 的基础应用壳层。客户、项目、订单、用户和完整仪表盘能力由 GitHub Issues 分阶段实现。业务数据通过 MSW 内存模拟；首期不连接真实后端，不包含登录、认证或权限系统。

## 环境变量

- VITE_BASE_PATH：部署基路径，默认 /；支持子路径部署。
- VITE_API_BASE_URL：后端 API 基地址，默认 /api。
- VITE_ENABLE_MSW：显式控制 MSW。未配置时开发环境默认开启、生产构建默认关闭；MSW handlers 在数据层 Issue 中实现。

## 结构约定

- src/app：应用 Providers、路由和运行时错误边界。
- src/config：环境变量、品牌与集中路由配置。
- src/layouts：本仓库专属应用布局。
- src/pages：页面入口。
- src/components：公共组件。
- src/features：按业务模块组织功能。
- src/lib/api：Axios 客户端与请求错误规范化。
- src/mocks：MSW worker、handlers 和内存演示数据。
- tests：按 src 结构镜像组织测试。

## 相关文档

- AGENTS.md：Codex 等 AI 编程 Agent 的执行规则。
- GitHub Issues：实施范围、依赖关系与验收标准。
