# 委托管理（commission）

> 首次创建日期：2026-04-23（进度文档回填）
> 相关代码：
> - 后端：`server/routes/commissions.js`、`server/utils/code.js`
> - 管理后台：`admin/src/views/commission/`
> - 小程序：`miniprogram/pages/buy-form/`、`miniprogram/pages/sell-form/`、`miniprogram/pages/commission/`
> - 数据库：`commissions` 表

## 已完成

- [x] 后端委托 CRUD API（`server/routes/commissions.js`）
- [x] 小程序买方委托表单（`miniprogram/pages/buy-form/`）
- [x] 小程序卖方委托表单（`miniprogram/pages/sell-form/`）
- [x] 小程序"我的委托"列表（`miniprogram/pages/commission/`）
- [x] 管理后台委托管理（按 type 分买/卖，`admin/src/views/commission/`）
- [x] v4 schema 新增字段：`code`（业务编号）、`port_registry`（港籍）、`price`（出售报价）（2026-04-20）
- [x] 业务编号生成规则：买委托 `GM+年份+4位序号`，卖委托 `CS+年份+4位序号`（`server/utils/code.js`）

## 关键决策

- **`type` 字段区分买卖**：不拆成两张表，用 `type='buy'` / `type='sell'` 区分。理由：字段差异小，统一表便于"我的委托"聚合查询。
- **`price` vs `budget`**：卖委托用 `price`（出售报价），买委托用 `budget`（预算）。两字段独立，前端根据 type 切换展示。
- **业务编号 `code` 独立于主键 `id`**：
  - `code` 用于对外展示（GM2026XXXX / CS2026XXXX），有年份信息，便于业务人员口头沟通
  - `id` 是主键，内部使用
  - v4 迁移时对历史数据做了 `code` 回填

## 已知限制 / 待办

- [ ] 编号序号按 `id` 而非按年内序号递增，跨年时序号不归零（`GM20260001` 后下一条可能是 `GM20270500` 而不是 `GM20270001`）
- [ ] 委托状态机未明确（提交 / 跟进中 / 成交 / 作废的流转规则）
- [ ] 历史数据 `port_registry` 默认空串，不是 NULL，但前端展示时要做空值兜底

## 踩坑记录

### ⚠️ 2026-04-25 船型输入方式不一致

- **现象**：小程序买方 / 卖方委托表单已经使用固定 `picker` 选择船型，但管理后台委托编辑弹窗和导入船舶库弹窗仍是手输输入框，容易产生 `test-buy`、大小写/空格等非标准船型
- **修复**：
  1. `admin/src/views/commission/index.vue` 新增统一 `shipTypes` 选项：`干散货船 / 甲板船 / 集装箱船 / 液货船 / 客船 / 其他`
  2. 买方委托编辑、卖方委托编辑、卖方导入船舶库三处 `ship_type` 改为 `el-select`
  3. 小程序端已确认买方 / 卖方表单均使用同一组 `picker` 选项，无需改动
- **预防**：两端涉及枚举字段时统一使用选择控件；不要在后台用自由输入覆盖小程序枚举

### ⚠️ 2026-04-25 管理后台委托主机字段展示口径同步

- **现象**：管理后台买方 / 卖方委托列表仍显示"主机功率"，并拼接"千瓦"，空值或 `0` 会显示成 `0千瓦`
- **修复**：
  1. `admin/src/views/commission/index.vue` 将买方、卖方列表列名统一改为"主机型号"
  2. 新增 / 编辑委托、导入船舶库弹窗中对应表单项改为"主机型号"
  3. 列表不再拼接"千瓦"，且 `0`、`0.00`、空值、`null/undefined` 不展示
- **说明**：本次只改展示口径，数据库字段仍沿用 `engine_power`，避免额外 schema migration

### ⚠️ v4 迁移对历史数据回填 code 的 SQL 必须幂等（2026-04-20）

- **现象**：首次运行 migration-v4.sql 正常，重复运行时报 `Duplicate entry` 错
- **根因**：`idx_commissions_code` 是唯一索引，回填 SQL 没加 `WHERE code = ''` 条件会重复回填
- **修复**：`server/config/migration-v4.sql` 回填 UPDATE 带 `WHERE code = ''` 过滤，第二次运行时匹配 0 行
- **预防**：所有 migration 脚本必须幂等，迁移前务必能安全重跑

---

<!-- 新条目追加到上方，保留历史记录 -->
