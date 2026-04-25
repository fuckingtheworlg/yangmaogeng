# 船舶管理（ship）

> 首次创建日期：2026-04-23（进度文档回填）
> 相关代码：
> - 后端：`server/routes/ships.js`
> - 管理后台：`admin/src/views/ship/index.vue`
> - 小程序：`miniprogram/pages/index/`、`miniprogram/pages/detail/`
> - 数据库：`ships` 表（schema 见 `docs/progress/schema.md`）

## 已完成

- [x] 后端 CRUD API（`server/routes/ships.js`）
- [x] 管理后台船舶管理页面（`admin/src/views/ship/index.vue`）
- [x] 小程序首页列表 + 筛选 + 搜索（`miniprogram/pages/index/`）
- [x] 小程序船舶详情页（`miniprogram/pages/detail/`）
- [x] 船舶图片上传（见 `upload.md`）
- [x] v4 schema 新增字段：`ship_name`（船号名称）、`net_tonnage`（净吨）、`base_price`（起价）（2026-04-20）

## 关键决策

- **`ship_no` vs `ship_name`**：两字段并存，`ship_no` 是业务编号，`ship_name` 是船号名称。前端两字段必须同时显示，不可合并。
- **`price` vs `base_price`**：`price` 是当前售价，`base_price` 是起价（底价）。管理后台编辑时两字段独立。
- **总吨 / 净吨并存**：`gross_tonnage` 和 `net_tonnage` 都保留，业务上有区分用途。
- **金额字段用 DECIMAL(10,2)**：不用 FLOAT，避免精度丢失。

## 已知限制 / 待办

- [ ] v4 迁移后，历史 ship 数据的 `ship_name` / `net_tonnage` / `base_price` 可能为 NULL，编辑旧数据时前端需要对 NULL 做兜底（见踩坑记录）
- [ ] 暂无批量导入功能
- [ ] 图片压缩 / CDN 加速未实现，当前走本地 `/uploads/` 静态服务

## 踩坑记录

### ⚠️ 2026-04-25 管理后台主机字段展示口径同步

- **现象**：管理后台船舶列表 / 详情 / 表单仍显示"主机功率"，并在列表、详情里拼接"千瓦"，与小程序详情页已调整的"主机型号"口径不一致
- **修复**：
  1. `admin/src/views/ship/index.vue` 将"主机功率 / 主机力量(千瓦)"统一改为"主机型号"
  2. 列表和详情不再拼接"千瓦"
  3. 主机型号字段为 `0`、`0.00`、空值、`null/undefined` 时后台列表不展示
- **说明**：本次只改展示口径，数据库字段仍沿用 `engine_power`，避免额外 schema migration

### ⚠️ 2026-04-25 小程序详情页展示 0 / 空值和船号字段

- **现象**：小程序船舶详情页会显示后台为 `0` 或空的数据，例如"总吨 0吨"；价格卡片还会额外显示 `ship_name` 对应的"船号"行，和业务编号展示混在一起
- **根因**：详情页 WXML 直接绑定 `ship.xxx` 字段，没有统一的可展示值过滤；`engine_power` 也被硬编码展示为"主机功率 + KW"
- **修复**：
  1. `detail.js` 新增 `isVisibleValue` / `makeField` / `buildDetailFields`，统一过滤 `0`、`0.00`、空字符串、`null/undefined`
  2. `detail.wxml` 的基本参数 / 建造信息 / 动力系统改为循环 `basicParams`、`buildInfo`、`engineInfo`，无可展示字段时整个区块隐藏
  3. 小程序详情页不再显示 `ship_name` 的"船号"行，仅保留 `ship_no` 的"船舶编号"
  4. 动力系统中"主机功率"改为"主机型号"，直接展示后台字段值，不再拼接 `KW`
- **预防**：新增展示字段时不要直接在 WXML 绑定原始值，先通过详情页字段构建函数过滤可展示值

### ⚠️ v4 迁移后编辑历史数据可能崩溃（2026-04-20）

- **现象**：编辑 v4 迁移之前就存在的旧船舶记录时，新字段为 NULL，前端 `parseFloat(row.base_price)` 报 NaN，保存后 SQL 写入字符串 `"null"` 或 NaN
- **根因**：
  1. `ALTER TABLE ADD COLUMN ... DEFAULT 0` 只对未来插入的行生效，历史行可能保持 NULL
  2. JS `typeof null === 'object'`，"是对象就 JSON.stringify" 的判断把 null 序列化成了字符串 `"null"`
- **修复**：
  - 前端：`admin/src/views/ship/index.vue` 编辑时对所有 DECIMAL 字段 `parseFloat(row.x) || 0` 兜底
  - 后端：写库前先排 `null/undefined`，再判断对象
- **预防**：Schema 迁移后必须抽样编辑一条**迁移前**的旧记录，走完整"读取 → 编辑 → 保存"流程（见 `.cursor/rules/dev-workflow.mdc` 第 4.2 条）

---

<!-- 新条目追加到上方，保留历史记录 -->
