# React Admin Template

面向企业业务系统的侧边栏管理后台脚手架，提供完整可演示的客户、项目、订单、用户管理与经营仪表盘。所有业务数据由 MSW 在前端内存中模拟，不依赖真实后端、账号体系或权限服务。

## 功能概览

- **应用壳层**：桌面侧边栏（可折叠为仅图标，偏好写入 `localStorage`）、窄屏 Drawer 导航、集中式路由/菜单/面包屑、可关闭页面标签（`sessionStorage` 刷新恢复）、浅色/深色主题。
- **经营仪表盘**：客户总量、进行中项目、待处理订单、启用用户四项指标；项目状态分布与订单金额趋势图；近 30 天 / 近 90 天 / 近 12 个月统计范围（同步到 URL）；加载、错误、重试与空数据状态。
- **客户管理**：关键词、状态、行业筛选；排序、分页；新建与快捷编辑 Drawer；详情页展示关联项目/订单；完整编辑页；删除前关联校验。
- **项目管理**：关键词、客户、状态、负责人、开始日期范围筛选；客户关联、负责人、进度、预算与日期校验；详情页展示客户与关联订单。
- **订单管理**：订单号/客户关键词、客户、状态、下单日期范围筛选；订单号自动生成；客户与项目级联选择；金额格式化；详情页展示客户与项目。
- **用户管理**：业务用户资料（姓名、用户名、邮箱、部门、角色/岗位、状态、最近登录）；启用/停用确认；不包含登录、密码或权限能力。
- **列表能力**：分页、搜索、筛选、排序与 URL query 同步；刷新、分享链接、浏览器前进/后退恢复；非法参数自动回退；重置筛选。
- **导入导出**：按当前筛选条件或选中行导出 CSV/XLSX；文件名包含模块名与时间；模拟上传支持类型/大小校验、进度、成功、失败与重试，不会写入任何服务器。
- **质量保障**：Vitest + React Testing Library + MSW，覆盖公共组件、路由元数据、主题、API 错误、数据层和四个业务模块的关键流程。

## 技术栈

React 19.3、TypeScript、Vite、Ant Design 6、React Router Data Router、TanStack Query、Axios、Zustand、MSW、Lucide React、Ant Design Charts、Day.js、ExcelJS、Vitest、React Testing Library。

样式使用 CSS Modules 与 Ant Design Design Token，不引入 Tailwind 或第二套图标库。

## 环境要求

- Node.js 22.12 或更新版本
- pnpm 10

## 快速开始

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

打开终端输出的本地地址即可。仓库已提交 `pnpm-lock.yaml`，依赖安装应使用冻结锁文件；变更依赖后需审查并提交锁文件更新。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动 Vite 开发服务器 |
| `pnpm build` | 类型检查并构建生产静态资源 |
| `pnpm preview` | 预览生产构建 |
| `pnpm lint` | 运行 ESLint（含 jsx-a11y） |
| `pnpm typecheck` | 执行 TypeScript 项目检查 |
| `pnpm test` | 运行 Vitest 测试 |
| `pnpm test:watch` | 监听模式运行测试 |
| `pnpm test:coverage` | 生成 V8 覆盖率报告到 `coverage/` |

## 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `VITE_BASE_PATH` | `/` | 部署基路径，支持子路径部署 |
| `VITE_API_BASE_URL` | `/api` | Axios 基地址，业务组件不得直接读取环境变量 |
| `VITE_ENABLE_MSW` | 开发 `true`，生产 `false` | 显式控制 MSW。开发环境如需连接真实 API 可设为 `false` |

环境变量集中解析于 `src/config/env.ts`。仓库不包含任何真实密钥。

## 主要路由

| 路径 | 页面 |
| --- | --- |
| `/` | 经营仪表盘 |
| `/customers` | 客户列表 |
| `/customers/:id` | 客户详情（关联项目/订单摘要） |
| `/customers/:id/edit` | 客户完整编辑 |
| `/projects` | 项目列表 |
| `/projects/:id` | 项目详情（关联客户/订单） |
| `/projects/:id/edit` | 项目完整编辑 |
| `/orders` | 订单列表 |
| `/orders/:id` | 订单详情（关联客户/项目） |
| `/orders/:id/edit` | 订单完整编辑 |
| `/users` | 业务用户列表 |
| `/users/:id` | 用户详情 |
| `/users/:id/edit` | 用户完整编辑 |

新建与快捷编辑使用 Drawer，不单独占用路由。菜单、面包屑、页面标题与标签标题统一从 `src/config/routes.tsx` 派生，避免多处硬编码不一致。

## 布局与偏好

- **侧边栏**：桌面默认展开，可折叠为仅图标；折叠状态保存在 `localStorage` 的 `admin-sidebar-collapsed`。窄屏（`< 768px`）使用 Drawer 导航。
- **页面标签**：打开路由时创建或激活标签；支持关闭；关闭当前标签后切换到相邻标签。标签保存在 `sessionStorage` 的 `admin-page-tabs`，刷新恢复，会话结束后不保留。
- **主题**：首次访问且无本地偏好时读取系统主题；手动切换后写入 `localStorage` 的 `app-theme`，并忽略后续系统主题变化。CSS 变量模式由 Ant Design `ConfigProvider` 启用。
- **无障碍**：语义化导航、可见焦点、键盘可操作的菜单与标签、工具栏按钮的 `aria-label`。

## 模拟 API 与数据规则

MSW 在开发环境默认启用，生产构建默认关闭；关闭时不会启动 mock worker。开发环境 service worker 文件位于 `public/mockServiceWorker.js`。

模拟数据仅保存在浏览器内存中：

- 刷新页面、重新打开标签或重启开发服务器后恢复为种子数据。
- 数据不会写入 `localStorage`、IndexedDB 或任何真实后端。
- 列表、详情、仪表盘共用同一份内存数据集，新增/修改/删除后会通过 TanStack Query 失效并刷新相关页面。

### 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/dashboard?range=30d\|90d\|12m` | 仪表盘指标、项目状态分布与订单趋势 |
| `GET/POST` | `/api/customers` | 客户列表 / 创建 |
| `GET/PUT/DELETE` | `/api/customers/:id` | 客户详情 / 更新 / 删除 |
| `GET/POST` | `/api/projects` | 项目列表 / 创建 |
| `GET/PUT/DELETE` | `/api/projects/:id` | 项目详情 / 更新 / 删除 |
| `GET/POST` | `/api/orders` | 订单列表 / 创建 |
| `GET/PUT/DELETE` | `/api/orders/:id` | 订单详情 / 更新 / 删除 |
| `GET/POST` | `/api/users` | 用户列表 / 创建 |
| `GET/PUT/DELETE` | `/api/users/:id` | 用户详情 / 更新 / 删除 |

列表查询参数包括 `page`、`pageSize`、`keyword`、`sortBy`、`sortOrder`，以及各模块的筛选参数（状态、行业、客户、负责人、日期范围、部门、角色等）。

### 错误与重试

- Axios 默认超时 15 秒，保留完整 `AxiosResponse`；错误统一规范化为 `ApiError`，保留原始 Axios 错误/响应并按网络、超时、取消、4xx、5xx 分类。
- 客户端 4xx 不重试；可重试的网络/超时/服务端查询错误最多重试一次；写入不自动重试。
- 公共层不自动弹窗，错误由页面状态、表单字段错误或操作反馈呈现，避免重复提示。
- 引用完整性：仍有关联项目/订单的客户、仍有关联订单的项目无法删除，接口返回 409 并在界面给出原因。

### 导出与模拟上传

- 导出覆盖当前搜索/筛选/排序条件下的全部数据，或 DataTable 中选中的行；CSV 使用 UTF-8 BOM 与转义规则，XLSX 由 ExcelJS 生成，列头与中文/日期/金额格式可读。
- 文件名形如 `客户列表_20261018-1530.csv`。
- 导入抽屉使用 Ant Design Upload 演示 CSV/XLSX 上传：校验扩展名、文件大小与空文件；展示进度、成功、失败与重试。文件只在浏览器内读取，用于演示状态流转，不会上传或写入模拟数据库。

## URL 列表状态

四个列表的分页、关键词、筛选与排序均同步到 URL query：

- 刷新、复制链接、浏览器前进/后退可恢复相同查询。
- 非法页码、页大小、排序字段、枚举筛选和日期会被忽略并回退到默认值。
- 关键词输入使用防抖并替换当前历史记录，避免每次按键产生历史条目；筛选、排序和分页使用正常历史记录。
- 重置筛选只清理列表相关参数，保留无关 query 参数。
- TanStack Query key 与规范化后的查询参数保持一致；Zustand 不保存任何服务端数据或可由 URL 表达的列表状态。

## 目录结构

```text
src/
  app/          应用 Providers、Data Router 装配与路由错误兜底
  config/       环境变量、品牌、路径、路由/菜单元数据、选项与公共文案
  features/     客户、项目、订单、用户、仪表盘（各自 API、hooks、组件与页面）
  components/   PageHeader、SearchFilterBar、DataTable、StatusTag、状态兜底、确认、抽屉、导入导出等
  layouts/      应用布局、侧边栏、面包屑与页面标签
  lib/          Axios 客户端、错误规范化、QueryClient、缓存键、失效策略、模拟上传
  hooks/        防抖、列表 URL 状态与关键词同步
  stores/       Zustand 页面标签状态（仅客户端 UI 状态）
  styles/       全局样式
  types/        统一实体、输入、查询与分页类型
  utils/        格式化、CSV/XLSX、列表参数解析、表格偏好等纯工具
  mocks/        MSW worker、handlers 与仅内存的种子数据
tests/          按 src 结构镜像组织，使用 MSW Node server
```

## 测试与质量门禁

测试使用 Vitest、React Testing Library 与 MSW Node server，覆盖：

- 公共工具、列表 URL 参数处理、导出文件内容、DataTable 排序/列显隐/密度/选择/分页、状态标签、主题、路由元数据与布局标签。
- 模拟 API 的分页、筛选、排序、校验、唯一性、引用约束、缓存一致性与仪表盘统计一致性。
- 客户、项目、订单、用户列表/详情/编辑/新建/状态操作及模拟上传关键流程。

交付前执行：

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
```

CI（`.github/workflows/ci.yml`）在 push 和 pull request 上执行相同的安装、lint、typecheck、测试、覆盖率与生产构建检查。

## 部署提示

生产构建是单页应用：静态服务器需要把未知路径回退到 `index.html`（history fallback），并确保 `VITE_BASE_PATH` 与实际部署子路径一致。项目本身不提供 Docker 或 Nginx 配置。

## 浏览器支持

Chrome、Edge、Firefox、Safari 当前及最近两个主要版本；不支持 IE。

## 范围说明

本仓库是前端模板与演示项目：

- 不包含真实后端、登录认证、账号生命周期、角色权限或 Docker/Nginx 部署配置。
- 用户管理仅维护演示用业务用户资料，不涉及密码或权限。
- 两个模板仓库完全独立，不使用对方的代码、私有包、workspace、submodule 或运行时依赖。

如后续接入真实 API，只需替换 `VITE_API_BASE_URL`、关闭 `VITE_ENABLE_MSW`，并在保留统一类型、错误处理和 Query key 约定的前提下替换 `src/features/*/api.ts` 的实现。
