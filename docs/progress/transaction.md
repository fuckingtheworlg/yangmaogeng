# 成交管理（transaction）

> 首次创建日期：2026-04-23（进度文档回填）
> 相关代码：
> - 后端：`server/routes/admin.js`（成交相关接口挂在 admin 下）、`server/utils/code.js`
> - 管理后台：`admin/src/views/transaction/`
> - 数据库：`transactions` 表

## 已完成

- [x] 管理后台成交记录 CRUD（`admin/src/views/transaction/`）
- [x] 业务编号生成：`CJ+年份+4位序号`（`server/utils/code.js`）
- [x] v4 schema 新增 `code` 字段（2026-04-20）

## 关键决策

- **成交只在管理后台维护，不开放给小程序**：小程序用户不能自行创建成交记录，必须管理员确认
- **`deal_date` 可为空**：历史数据迁移时允许 `deal_date` 为空，此时 `code` 生成用 `NOW()` 兜底

## 已知限制 / 待办

- [ ] 成交与委托（commission）未建立显式关联，无法从委托页面追溯到最终成交记录
- [ ] 缺少成交金额统计 / 报表功能

## 踩坑记录

_本模块暂无记录。新增条目请追加到此处上方。_

---

<!-- 新条目追加到上方，保留历史记录 -->
