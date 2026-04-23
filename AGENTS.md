# AGENTS.md - AI 协作项目说明

本文件是 AI 编码助手（Cursor / Claude Code 等）进入本项目的**第一读物**。
所有会话开始前，AI 必须先读完本文件。

---

## 1. 项目概况

**项目名**：羊毛梗船舶服务中心信息发布平台
**领域**：船舶交易信息平台（浏览、委托、成交管理）
**架构**：小程序（用户端） + 管理后台（管理员端） + Node 后端 API

### 三端职责

| 子目录 | 角色 | 技术栈 |
|---|---|---|
| `miniprogram/` | 微信小程序（用户端，C 端） | 原生微信小程序 WXML + WXSS + JS |
| `admin/` | Web 管理后台（管理员端，B 端） | Vue 3 + Element Plus + Vite |
| `server/` | 后端 API | Node.js 18 + Express 5 + MySQL 8 |

### 数据流原则

```
miniprogram  ─┐
              ├─► server (Express) ─► MySQL
admin        ─┘                    └─► uploads/ (本地文件存储)
```

- 小程序和管理后台**都**通过后端 API 访问数据，禁止任何一端直连数据库
- 所有业务规则在后端实现；前端两端不得绕过后端做数据校验作为唯一防线
- 两端共享同一套数据库表，字段命名必须一致

---

## 2. 目录结构详解

```
yaomaogeng/
├── AGENTS.md                    ← 本文件
├── README.md                    ← 给人看的项目介绍
├── .cursor/
│   └── rules/
│       └── dev-workflow.mdc     ← 项目级 AI 规则（本项目专属）
├── docs/
│   └── progress/                ← 各模块进度文档（规则强制维护）
├── server/                      ← 后端
│   ├── app.js                   ← 入口，路由注册在此
│   ├── routes/                  ← Express 路由（按资源拆分）
│   │   ├── admin.js             管理端鉴权 + 管理员操作
│   │   ├── wx.js                小程序登录 / 用户信息
│   │   ├── ships.js             船舶 CRUD
│   │   ├── commissions.js       委托（买/卖）
│   │   ├── favorites.js         收藏
│   │   └── upload.js            文件上传
│   ├── middleware/auth.js       JWT 鉴权
│   ├── config/
│   │   ├── db.js                数据库连接池
│   │   ├── init.sql             初始 schema
│   │   ├── seed.sql             种子数据
│   │   └── migration-v*.sql     版本迁移脚本（追加式）
│   ├── utils/code.js            业务编号生成（GM/CS/CJ + 年 + 序号）
│   ├── uploads/                 上传文件存储（本地）
│   ├── deploy.sh                部署脚本
│   └── setup-nginx.sh           Nginx 配置脚本
├── admin/                       ← 管理后台
│   ├── src/
│   │   ├── views/
│   │   │   ├── ship/            船舶管理
│   │   │   ├── commission/      委托管理
│   │   │   ├── transaction/     成交管理
│   │   │   ├── user/            用户管理
│   │   │   ├── dashboard/       首页
│   │   │   └── login/           登录
│   │   └── api/                 axios 封装
│   └── dist/                    ← 构建产物（需提交到 git，详见第 6 节）
├── miniprogram/
│   ├── app.js / app.json        小程序入口与配置
│   ├── pages/
│   │   ├── index/               首页列表
│   │   ├── detail/              船舶详情
│   │   ├── buy-form/            购买委托
│   │   ├── sell-form/           出售委托
│   │   ├── commission/          我的委托
│   │   └── profile/             个人中心
│   ├── components/              公共组件
│   └── utils/                   工具函数
└── test-scripts/                ← API 回归测试脚本
```

---

## 3. 术语表（代码中的命名约定）

| 中文 | 代码中的名字 | 不要用的错误叫法 |
|---|---|---|
| 船舶 | `ship` / `ships` | ~~vessel / boat~~ |
| 委托 | `commission` / `commissions` | ~~order / request~~ |
| 成交 / 交易 | `transaction` / `transactions` | ~~deal / trade~~ |
| 买方委托 | `commission.type = 'buy'` | — |
| 卖方委托 | `commission.type = 'sell'` | — |
| 船号 | `ship_no`（编号）/ `ship_name`（名称） | 两个字段**不等价** |
| 总吨 / 净吨 | `gross_tonnage` / `net_tonnage` | — |
| 业务编号 | `code`（GM+年+序号=买委托，CS+年+序号=卖委托，CJ+年+序号=成交） | 不要和主键 `id` 混淆 |
| 港籍 | `port_registry` | ~~port / harbor~~ |

---

## 4. 技术栈版本约束

- **Node.js**: 18.x（`server/` 使用 CommonJS）
- **MySQL**: 8.0+，字符集 utf8mb4
- **Express**: 5.x（注意 5 和 4 路由语法有差异，匿名中间件异常处理改进了）
- **Vue**: 3.5+（组合式 API 优先）
- **Element Plus**: 2.13+
- **Vite**: 8.x
- **小程序基础库**: 建议 2.27+（涉及隐私协议相关 API）

---

## 5. 启动命令速查

```bash
# 后端
cd server && npm install && npm run dev    # 开发（--watch 自动重启）
cd server && npm start                      # 生产

# 管理后台
cd admin && npm install && npm run dev      # 开发
cd admin && npm run build                   # 构建到 dist/

# 数据库
mysql -u root -p < server/config/init.sql           # 初始化
mysql -u root -p yaomaogeng < server/config/seed.sql # 种子
mysql -u root -p yaomaogeng < server/config/migration-v4.sql  # 迁移

# 小程序
# 用微信开发者工具导入 miniprogram/ 目录
```

默认管理员账号：`admin` / `admin123`
默认后端端口：`3000`
数据库名：`yaomaogeng`

---

## 6. 本项目特有的血泪教训（导览）

详细内容在 `.cursor/rules/dev-workflow.mdc`，以下只列标题，便于 AI 会话起手快速扫描：

| # | 场景 | 一句话 |
|---|---|---|
| 1 | 后端 API 变更 | `bash scripts/lint-residuals.sh` 扫 mock / IP 残留；两端都要查 |
| 2 | 微信小程序平台 API | 先查「用户隐私保护指引」勾选 + `__usePrivacyCheck__`，禁止用 text 替换 nickname 绕过 |
| 3 | 写数据库 | `typeof null === 'object'`，序列化前先排 null；migration 后必抽样旧数据 |
| 4 | 管理后台 dist/ | 白名单 `!admin/dist/`，`npm run build` 后必 `git status` 确认变更 |
| 5 | 部署后验证 | API 层 / 管理后台 / 小程序端三层一致才算完成；跑 `test-scripts/run-all-tests.sh` |
| 6 | 模块完成 | 更新 `docs/progress/<模块>.md`（模块映射表见 dev-workflow.mdc 第 6 节） |

**遇到坑请直接读 `.cursor/rules/dev-workflow.mdc` 对应章节，不要在 AGENTS.md 里扩写。**

---

## 7. AI 协作规则索引

本项目受三层规则约束（优先级从高到低）：

1. **项目规则** `.cursor/rules/dev-workflow.mdc` — 本项目特有的 6 大防错规范
2. **全局规则** `~/.cursor/rules/`
   - `ai-working-contract.mdc` — AI 工作契约（动手前 / 动手中 / 交付前）
   - `debug-methodology.mdc` — 排查方法论（先证据后结论）
   - `progress-doc.mdc` — 模块完成后更新 `docs/progress/`

遇到冲突时，项目规则覆盖全局规则。任何跳过规则的行为必须显式说明。

---

## 8. 可用 Skills（按需主动触发）

以下 skills 已安装到 `~/.cursor/skills/`，AI 应在匹配场景下主动使用：

| 场景 | Skill |
|---|---|
| 前端报错 / API 调用失败 / HTTP 异常 | `debug-with-logs` |
| API 回归测试 / 上传但图片不显示 / 联调问题 | `api-regression-test` |
| 部署到阿里云 / Linux 服务器配置 | `deploy-backend` |
| 生成论文 / 答辩材料 / 架构图 | `thesis-paper-generator` |

---

## 9. 当前项目状态

- **最新 schema 版本**：v4（见 `server/config/migration-v4.sql`）
- **已上线功能**：船舶 CRUD、委托收发、成交记录、小程序用户端全量功能
- **进度文档**：见 `docs/progress/`（按模块维护）
- **已知限制**：见各模块的 `docs/progress/<模块>.md` 中的「已知限制 / 待办」段

---

## 10. 对 AI 的总体期待

1. **进入任何模块前**先读 `docs/progress/<模块>.md`
2. **修改后端 API** 必须同步确认小程序端和管理后台两端
3. **修改数据库 schema** 必须同步新建 migration 脚本，并测试历史数据
4. **部署后** 主动执行三层验证，或提醒用户执行
5. **完成模块级任务** 必须更新 `docs/progress/<模块>.md`
6. **不确定** 必须先提问，禁止猜测平台配置 / 业务规则 / 字段语义
