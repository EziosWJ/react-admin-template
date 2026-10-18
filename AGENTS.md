# AGENTS.md

## 项目定位
本仓库是独立的 React + TypeScript 企业管理后台脚手架，采用侧边栏布局。所有业务均为前端演示与 MSW 内存模拟，不接入真实后端、登录认证或权限系统。

## 开发前必须阅读
1. 根目录 README.md：安装、命令、环境变量和当前功能。
2. 本文件：架构边界、编码约定和执行限制。
3. docs/README.md：正式文档索引与决策优先级。
4. 与任务相关的 docs/spec/：产品范围、功能行为和可验证要求。
5. 与任务相关的 docs/adr/：已接受的技术决策。
6. docs/acceptance.md：交付验收清单。
7. 对应 GitHub Issue：具体任务范围与补充验收条件。

若 Issue/Prompt 与已确认决策、SPEC 或 Accepted ADR 冲突，必须先报告冲突；不得擅自选择较方便的实现，也不得修改规范以迁就当前代码。

## 技术基线
- React 19.3、TypeScript、Vite、pnpm。
- Ant Design 6；样式使用 CSS Modules + Ant Design Design Token，不引入 Tailwind。
- React Router Data Router（`createBrowserRouter` + `RouterProvider`），路由页面使用 `React.lazy` + `Suspense`。
- Axios 负责 HTTP 客户端；TanStack Query 管理服务端数据；Zustand 仅管理必要的跨组件客户端状态；局部状态使用 React Hooks。
- MSW 模拟 API；Lucide React 作为默认图标库；Ant Design Charts 用于图表；Day.js 处理日期；ExcelJS 生成 XLSX，CSV 使用独立轻量工具。
- Vitest + React Testing Library；ESLint 包含 `eslint-plugin-jsx-a11y`。

## 布局与交互约定
- 侧边栏默认展开，支持折叠为仅图标模式；折叠偏好保存到 `localStorage`；窄屏改为 Drawer。
- 应用内页面标签支持关闭，使用 `sessionStorage` 保存并在刷新后恢复，不要求跨浏览器会话保留。
- 首次访问主题跟随操作系统；用户手动切换后保存到 `localStorage`。
- 默认中文文案集中管理；保留国际化扩展空间，首期不引入完整国际化框架。
- CRUD 采用混合交互：列表独立页面、复杂详情/编辑独立路由、简单新建/快速编辑使用 Drawer、危险操作使用确认弹窗。

## 架构规则
- 集中管理环境变量于 `src/config/env.ts`；业务代码不得直接访问 `import.meta.env`。
- 集中管理品牌配置于 `src/config/app.config.ts`，路由、菜单和面包屑元数据统一从集中路由配置派生。
- API Base URL 只通过 `VITE_API_BASE_URL` 配置。Axios 默认超时 15 秒，默认保留完整 `AxiosResponse`，不猜测后端响应结构。
- 请求错误需要分类并保留原始 Axios 错误/响应；公共层不得自动弹窗。客户端 4xx 不重试；可重试网络/服务端查询错误最多重试一次；写入不自动重试。
- Query 默认 `staleTime=30_000`、`gcTime=300_000`。
- MSW 开发环境默认启用、生产默认关闭；模拟数据仅存内存，刷新后重置。
- URL 管理列表分页、已提交搜索/筛选和排序状态；不得在 Zustand 中重复保存服务端数据或可由 URL 表达的列表状态。
- `DataTable` 必须显式配置稳定唯一的 `rowKey`，禁止以数组索引作为默认标识。通用组件不负责行点击导航，也不内置业务排序逻辑。
- 公共组件提供可配置搜索/筛选、列显隐、三档密度、批量操作工具栏及当前页/跨分页选择策略；列宽仅通过列配置设置，不提供拖拽调宽。
- 导出默认覆盖全部符合当前搜索/筛选条件的数据；服务端导出数据由业务提供获取方法。上传类型、大小、数量和预览处理器均可配置。
- 纯日期采用 `YYYY-MM-DD`，不做时区转换；时间点采用带明确时区的 ISO 8601 格式。
- 使用 CSS Modules 和 Ant Design Token；不要新增 Tailwind、Storybook 或第二套图标库。
- 两个模板仓库完全独立，不得使用对方的代码、私有包、workspace、submodule 或运行时依赖。

## 目录约定
- `src/app/`：应用 Providers、路由装配和全局错误边界。
- `src/config/`：环境变量、品牌、路由/菜单和静态选项配置。
- `src/layouts/`：应用布局与导航。
- `src/components/`：可复用 UI 组件。
- `src/features/<feature>/`：客户、项目、订单、用户等业务模块及各自 API/types/components。
- `src/lib/api/`：Axios 客户端与错误规范化。
- `src/mocks/`：MSW worker、handlers、仅内存的演示数据。
- `src/hooks/`、`src/stores/`、`src/utils/`、`src/styles/`：共享 hooks、客户端状态、纯工具和全局样式。
- `tests/`：所有测试集中存放，按模块镜像 `src/` 目录组织。

## 质量要求
- 新增可见交互必须真正可用；不允许死按钮、无说明的空白页或用静态假数据冒充 API 结果。
- 页面必须覆盖加载、错误、空数据状态；危险操作需要确认；网络错误避免重复提示。
- 优先使用语义化 HTML、键盘可操作控件、可见焦点、正确标签和必要的 ARIA 属性。
- 首期不设全局覆盖率硬门槛，但必须生成覆盖率报告，并优先测试公共工具、路由、主题、API 错误、DataTable 关键交互和核心业务逻辑。
- 修改后运行相关测试；交付前必须通过 `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`。
- 浏览器支持 Chrome、Edge、Firefox、Safari 当前及最近两个主要版本；不支持 IE。
- 生产错误页不得暴露堆栈或内部实现细节。

## 执行边界
- 严格遵守当前 Issue 的范围和验收条件；不要顺手扩大需求。
- 先检查已有实现再修改，避免重复组件、重复 API 和重复状态。
- 不添加真实后端、认证/授权、Docker 或 Nginx 部署配置。
- 版本更新必须检查 React、Ant Design、React Router、Ant Design Charts、测试工具之间的兼容性，并提交更新后的 `pnpm-lock.yaml`。
- 若 Issue 与现有已确认决策冲突，优先遵守本文件和正式 SPEC/ADR，并在 Issue 中说明，不得擅自改动架构决策。


## 正式规范文档与决策治理
- docs/spec/ 是产品与功能行为的规范来源；docs/adr/ 记录技术路线和架构边界；docs/acceptance.md 定义可验证交付条件。
- 新功能先更新 SPEC 和验收项，再实施；改变技术路线、数据流、状态归属或公共组件契约时必须更新 ADR。
- 已确认决策、Accepted ADR 和 SPEC 不得被临时 Issue/Prompt 覆盖。冲突应显式报告并等待决策，不得默默更改范围。
- 文档与实现有差距时，保留差距并创建实现任务；不得降低验收标准或声称未执行的测试已经通过。
- 本仓库独立维护文档和代码，不依赖另一模板仓库的文档、代码包、workspace、submodule 或运行时依赖。
