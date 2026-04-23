# 数据库 Schema

> 首次创建日期：2026-04-23（进度文档回填）
> 相关代码：`server/config/`

## Schema 版本历史

| 版本 | 脚本 | 主要变更 | 日期 |
|---|---|---|---|
| init | `init.sql` | 初始表结构：ships / commissions / transactions / users / admins / favorites | - |
| seed | `seed.sql` | 种子数据 | - |
| v2 | `migration-v2.sql` | （见脚本） | 2026-04-17 |
| v3 | `migration-v3.sql` | （见脚本） | 2026-04-20 |
| v4 | `migration-v4.sql` | ships 新增 ship_name / net_tonnage / base_price；commissions 新增 code / port_registry / price；transactions 新增 code；回填历史 code | 2026-04-20 |

## 当前 schema 版本

**v4**（最新）

## 关键决策

- **Migration 命名**：`migration-v<N>.sql`，单调递增，不回滚，不删除
- **回填历史数据**：每次 ADD COLUMN 后，必须在同一 migration 脚本中用 UPDATE 回填合理默认值
- **所有 migration 必须幂等**：`WHERE code = ''`、`IF NOT EXISTS` 等守卫条件必须完备
- **字符集**：所有表强制 `utf8mb4`

## 已知限制 / 待办

- [ ] 没有自动化 migration 工具，目前靠手动执行 `mysql < migration-v<N>.sql`
- [ ] 无 schema 版本记录表，无法在运行时查询当前数据库版本
- [ ] 未建立回滚脚本（每个 migration 对应的 down 脚本）

## 踩坑记录

### ⚠️ ADD COLUMN 带 DEFAULT 0 不代表历史行有值

- **现象**：`ALTER TABLE ships ADD COLUMN net_tonnage INT DEFAULT 0` 执行后，部分历史行 `net_tonnage` 仍为 NULL
- **根因**：MySQL 对已存在行的 DEFAULT 填充并不总是一致，某些执行路径下旧行保留 NULL
- **修复**：migration 脚本 ADD COLUMN 后立刻 `UPDATE ... SET xxx = 0 WHERE xxx IS NULL` 做显式兜底
- **预防**：见 `.cursor/rules/dev-workflow.mdc` 第 4.2 条。**每次** schema 迁移后必须抽样测一条迁移前的旧数据

### ⚠️ 回填 code 时 UPDATE 必须带条件，否则唯一索引冲突

- **现象**：重复运行 migration-v4.sql 报 `Duplicate entry ''`
- **根因**：`idx_commissions_code UNIQUE` 上，若回填 SQL 不带 `WHERE code = ''`，第二次执行会把已有 code 再次 UPDATE 成新值
- **修复**：所有回填 UPDATE 带 `WHERE <新列> = '' OR <新列> IS NULL` 过滤
- **预防**：migration 脚本必须支持安全重跑（幂等）

---

<!-- 新条目追加到上方，保留历史记录 -->
