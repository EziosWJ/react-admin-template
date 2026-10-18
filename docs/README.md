# 正式文档索引

本目录是 React Admin Template（侧边栏管理后台） 的产品、架构、技术决策与验收基线。最后更新：2026-10-18。

## 必读顺序
1. 根目录 README.md：项目用途、启动方式与现有功能。
2. 根目录 AGENTS.md：执行边界、代码约定与质量门禁。
3. 相关 SPEC：实现行为、范围与边界。
4. 相关 ADR：技术选择及其约束。
5. [交付验收清单](acceptance.md)：逐项验证交付结果。

## 文档权威性
- 已确认的用户决策是最高产品约束。
- Accepted ADR 约束架构与技术选择；SPEC 约束产品范围、功能行为和交互契约。
- Issue 或临时 Prompt 不得覆盖已确认决策、SPEC 或 Accepted ADR。出现冲突时先报告并暂停相关实现，不得通过修改规范迁就现有代码。
- README 描述项目和使用方法；若 README 或实现与正式 SPEC/ADR 冲突，应修正不一致的一方，不能把现状自动视为正确规范。
- 文档与功能变更应同步更新；如果本次仅补规范，应明确记录已知实现差距，不得声称功能已经通过验收。

## SPEC 与架构文档
- [SPEC-0001 产品范围](spec/0001-product-scope.md)
- [SPEC-0002 业务模型与 API](spec/0002-domain-and-api.md)
- [SPEC-0003 列表状态与 DataTable](spec/0003-list-query-and-datatable.md)
- [SPEC-0004 UI 与无障碍](spec/0004-ui-and-accessibility.md)
- [SPEC-0005 质量与验收](spec/0005-quality-and-acceptance.md)
- [架构说明](architecture.md)
- [交付验收清单](acceptance.md)

## ADR
- [ADR-0001 技术栈](adr/0001-technology-stack.md)
- [ADR-0002 状态与 API 边界](adr/0002-state-and-api-boundaries.md)
- [ADR-0003 导航与应用壳层](adr/0003-layout-and-navigation.md)
- [ADR-0004 DataTable 契约](adr/0004-datatable-contract.md)
- [ADR-0005 MSW 与无持久化边界](adr/0005-msw-and-no-persistence.md)
- [ADR-0006 CRUD 与危险操作交互](adr/0006-crud-and-destructive-actions.md)

## 维护规则
1. 新功能先更新 SPEC 和验收标准，再实现。
2. 改变技术路线、状态归属、接口边界或公共组件契约时，新增或更新 ADR。
3. 被替代的 ADR 标记为 Superseded，并链接替代决策，不删除历史。
4. 每个仓库独立维护文档，不依赖另一个模板仓库中的文档、代码包、workspace 或运行时依赖。
5. 提交前检查路由、目录、命令和接口是否与仓库结构一致；实现暂未符合规范时，明确标注为待修复差距。
