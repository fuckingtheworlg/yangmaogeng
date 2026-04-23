# 模块进度文档

本目录记录各业务模块的开发进度、关键决策、已知限制和踩坑记录。
**维护规则见 `~/.cursor/rules/progress-doc.mdc` 和 `.cursor/rules/dev-workflow.mdc` 第 7 条。**

## 目录索引

| 模块 | 文件 | 说明 |
|---|---|---|
| 船舶管理 | [`ship.md`](./ship.md) | 船舶 CRUD、图片上传、筛选 |
| 委托管理 | [`commission.md`](./commission.md) | 买卖委托、编号生成（GM/CS） |
| 成交管理 | [`transaction.md`](./transaction.md) | 成交记录、编号生成（CJ） |
| 用户管理 | [`user.md`](./user.md) | 小程序用户、管理员账号 |
| 收藏功能 | [`favorites.md`](./favorites.md) | 小程序端收藏 |
| 文件上传 | [`upload.md`](./upload.md) | 船舶图片、静态资源 |
| 数据库迁移 | [`schema.md`](./schema.md) | schema 版本历史 |
| 部署与运维 | [`deploy.md`](./deploy.md) | 服务器部署、Nginx 配置 |

## 如何新增模块文档

1. 复制 `_TEMPLATE.md` 到 `<模块名>.md`
2. 按四段式结构填写
3. 在本 README 的「目录索引」追加条目

## 四段式结构（禁止变动）

```markdown
# <模块名>

## 已完成
- [x] ...（YYYY-MM-DD）

## 关键决策
- <为什么这么做，为什么不那么做>

## 已知限制 / 待办
- [ ] ...

## 踩坑记录
- ⚠️ 现象 / 根因 / 修复位置
```

## 文档规范

- 每个模块一个文件，**不要**把多个模块合并
- 新内容**追加**到对应段末尾，不要删除历史条目
- 踩坑记录永久保留，不得清理（即使已修复）—— 这是后续 AI 的知识库
- 涉及多模块的改动，各模块文档**都要**更新
