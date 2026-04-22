# 羊毛梗 API 回归测试套件

基于 shell + curl + jq 的后端 API 冒烟/回归测试，面向已部署的真实后端（默认指向阿里云）。
设计原则参见 `~/.cursor/skills-cursor/api-regression-test/SKILL.md`。

## 目录

```
test-scripts/
├── README.md              # 本文
├── _lib.sh                # 共享：login_as / api_call / assert_* / 计数器
├── 01_auth.sh             # 管理员登录 & 鉴权边界
├── 02_ships.sh            # 船舶 CRUD + 公开接口
├── 03_commissions.sh      # 委托（管理员 + 小程序用户双路径）
├── 04_favorites.sh        # 用户收藏
├── 05_upload.sh           # 上传 + /uploads 静态回链（Part B 轻量版）
├── 06_wx.sh               # 微信登录 & 越权边界
├── 99_frontend_proxy.sh   # admin dev server 代理检查（Part B 完整版）
└── run-all-tests.sh       # 依次跑全部脚本
```

## 依赖

- `curl`
- `jq`（mac 用 `brew install jq`；Linux 用 `apt-get install jq`）

## 快速开始

```bash
# 对线上后端跑全套（默认 BASE_URL=http://47.114.89.50）
bash test-scripts/run-all-tests.sh

# 对本地后端跑
BASE_URL=http://localhost:3000 bash test-scripts/run-all-tests.sh

# 只跑单个套件
bash test-scripts/02_ships.sh

# 自定义管理员账号
ADMIN_USER=admin ADMIN_PASS=admin123 bash test-scripts/run-all-tests.sh
```

## 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `BASE_URL` | `http://47.114.89.50` | 被测后端地址，不带末尾 `/` |
| `ADMIN_USER` | `admin` | 管理员用户名 |
| `ADMIN_PASS` | `admin123` | 管理员密码 |
| `ADMIN_DEV_PORT` | `5173` | admin vite dev server 端口（仅 `99_frontend_proxy.sh` 使用） |

## 测试数据命名约定

所有脚本创建的资源名都带 `test_` / `auto_` / `fav_test_` / `auto_seller_` 前缀 + 时间戳，便于人肉清理。
各脚本末尾会 DELETE 自身创建的数据，套件是**自清理的**（idempotent）。

用户端通过 `/api/wx/login` 的 mock openid 机制创建用户（`wx.js` 对未知 openid 自动创建）。
`login_as user` 默认 code 是 `automation_fixed`，会复用同一个测试用户，不会无限堆积。
仅 `06_wx.sh` 会用时间戳 code 创建临时用户并在结尾删除。

## Part B：前端加载 /uploads 资源检查

- `05_upload.sh` 内置**轻量版**：若检测到 admin dev server 在跑就顺便验一下
- `99_frontend_proxy.sh` 是**完整版**：验证 `/api` 和 `/uploads` 两条代理链路都正常，且返回的 Content-Type 是 `image/*` 而不是被 SPA fallback 成 `text/html`
- 两者都会在 admin dev server 未运行时 skip，不算失败

## 小程序侧的限制

微信小程序**不**走 vite dev server，而是通过微信后台"服务器域名白名单" + `wx.request` 绝对 URL 访问后端。
本套件只用 mock openid 测试后端 `/api/wx/*` 和 `/api/commissions`、`/api/favorites` 接口；
域名白名单/HTTPS 证书/基础库版本等微信平台配置问题无法用 curl 覆盖，需要真机+微信开发者工具验证
（参考 `.cursor/rules/dev-workflow.mdc` 第 3 条）。

## 部署后验证建议

每次推代码到服务器后：

```bash
# 1. API 层
bash test-scripts/run-all-tests.sh

# 2. 管理后台
open http://47.114.89.50/ship

# 3. 小程序真机预览
```

三层数据一致才算部署完成（对应 `dev-workflow.mdc` 第 5 条）。

## 添加新 feature 的测试

按 `0X_<feature>.sh` 创建文件，模板：

```bash
#!/usr/bin/env bash
set -u
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/_lib.sh"
check_backend
section "XX 新特性"

TOKEN=$(login_as admin) || { _fail "登录失败"; print_summary; }
TS=$(date +%s)

RESP=$(api_call POST /api/admin/xxx "$TOKEN" '{"name":"test_'${TS}'"}')
assert_ok "创建 xxx" "$RESP"
ID=$(echo "$RESP" | jq -r '.data.id')

# ... 断言 ...

api_call DELETE "/api/admin/xxx/${ID}" "$TOKEN" >/dev/null
print_summary
```

务必保证：
1. **自清理**——脚本末尾删掉自己创建的资源
2. **每个脚本独立登录**——不共享 token（允许过期）
3. **从不"改测试让它过"**——断言失败优先怀疑被测代码
