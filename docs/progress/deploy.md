# 部署与运维（deploy）

> 首次创建日期：2026-04-23（进度文档回填）
> 相关代码：
> - `server/deploy.sh`
> - `server/setup-nginx.sh`
> - `server/setup-ssl.sh`（阿里云免费 DV 证书手动上传）
> - `server/setup-ssl-certbot.sh`（Let's Encrypt 全自动签发+自动续期，**推荐**）
> - `admin/dist/`（需提交到 git，详见下方）

## 已完成

- [x] 后端部署脚本（`server/deploy.sh`）
- [x] Nginx 配置脚本（`server/setup-nginx.sh`）
- [x] 管理后台 dist/ 提交到 git（`.gitignore` 有 `!admin/dist/` 白名单）
- [x] **域名 + HTTPS 接入**（2026-04-23）
  - 域名 `yangmaogeng.top` 阿里云 ICP 备案通过：皖ICP备2026010339号-1
  - 微信小程序 request 合法域名已配置：`https://yangmaogeng.top`
  - Nginx 脚本升级为幂等双模：有证书→HTTPS+HTTP301 跳转，无证书→HTTP only（过渡态）
  - 新增 `server/setup-ssl.sh`：接收阿里云 Nginx 版证书（`yangmaogeng.top.pem` / `yangmaogeng.top.key`），部署到 `/etc/nginx/ssl/` 并自动切 HTTPS 配置
  - 三端彻底去掉硬编码 `http://47.114.89.50`：
    - 小程序 `miniprogram/app.js` → `https://yangmaogeng.top`
    - 管理后台 `admin/src/api/index.js` → 相对路径 `/api`
    - 管理后台 4 个 vue/component 的 `API_BASE` 全部移除，图片 URL 使用相对路径 `/uploads/xxx`
    - 测试脚本默认 `BASE_URL` → `https://yangmaogeng.top`

## 关键决策

- **dist/ 进 git**：不在服务器上构建，本地构建后把 `admin/dist/` 一并 commit + push，服务器 pull 即可更新前端。理由：服务器资源有限，避免 node_modules 体积和构建失败风险。
- **前端静态资源由 Nginx 直接服务**，不走 Node。API 请求由 Nginx 反向代理到 `localhost:3000`
- **上传文件本地存储**：`server/uploads/`，Nginx 映射到 `/uploads/` 路径
- **管理后台 API 用相对路径 `/api`**（而非绝对 URL）：管理后台和 API 同域部署在 Nginx 下，相对路径自动跟随页面 origin，换域名/切 http↔https 零代码改动。
  - 对应地，图片 URL 也用相对 `/uploads/xxx`，浏览器自动拼当前 origin
- **小程序端必须硬编码完整 HTTPS 绝对地址**（`https://yangmaogeng.top`）：小程序不在浏览器里，没有 "当前 origin" 概念；且微信强制 HTTPS，且域名必须在"合法域名白名单"里。
- **HTTPS 证书支持两种方式**，统一落到 `/etc/nginx/ssl/yangmaogeng.top.{pem,key}` 路径：
  - **推荐：Let's Encrypt + certbot**（`setup-ssl-certbot.sh`）——全程 SSH 命令行，webroot 模式申请，systemd timer 自动续期，deploy-hook 自动 reload nginx
  - 备选：阿里云免费 DV（`setup-ssl.sh`）——需要控制台点击申请 + scp 上传，3 个月手动续期
- **证书文件固定路径 `/etc/nginx/ssl/yangmaogeng.top.{pem,key}`**：`setup-nginx.sh` 检测这两个文件决定是否启用 HTTPS；两种 ssl 脚本都会把证书拷贝/软链到这个固定位置，对 Nginx 配置完全透明。

## 已知限制 / 待办

- [ ] 未使用 PM2 / systemd 做进程守护（目前可能依赖手动 `npm start` + screen）
- [ ] 无自动化 CI/CD，全部手动
- [ ] 无备份策略（数据库 + uploads/）
- [ ] 无监控告警
- [ ] **SSL 证书未启用 HSTS**：首次接入先观察稳定性，稳定后可在 Nginx 加 `Strict-Transport-Security`
- [ ] **证书仅覆盖裸域名 `yangmaogeng.top`**，未签发 `www.yangmaogeng.top`。certbot 方案后续追加只需 `-d www.yangmaogeng.top` 重跑即可
- [ ] **阿里云 ECS 安全组 443 端口需手动放行**（certbot 还需 80 端口用于 HTTP-01 challenge）
- [ ] certbot 自动续期已配置（systemd timer 或 cron 兜底），但**无告警**：续期失败仅会写 `/var/log/letsencrypt/letsencrypt.log`，建议接入钉钉/短信告警

## 踩坑记录

### ⚠️ Nginx 1.20 不认识 `http2 on;` 新语法（2026-04-23）

- **现象**：`setup-ssl-certbot.sh` 跑到第 5 步 `nginx -t` 报 `unknown directive "http2" in /etc/nginx/conf.d/yaomaogeng.conf`
- **根因**：Nginx 从 1.25.1 起把 HTTP/2 启用方式从 `listen 443 ssl http2;` 改成独立指令 `http2 on;`。阿里云 AlibabaCloud Linux 官方仓库装的是 `nginx-1:1.20.1-1.0.7.al8`（2021 年版本），只认老语法。
- **修复位置**：`server/setup-nginx.sh` HTTPS server 块——改回 `listen 443 ssl http2;` 单行写法。新版 Nginx (1.25+) 对此只会有 deprecated warning，不影响使用，兼容性最好。
- **预防**：写 Nginx 脚本时，凡是 1.25+ 引入的新语法（`http2 on;`、`quic`、`ssl_preread_protocols` 等）都要考虑宿主 Nginx 版本。`nginx -v` 是第一步。

### ⚠️ ICP 备案通过 ≠ DNS 解析完成（2026-04-23）

- **现象**：备案通过后直接跑 `setup-ssl-certbot.sh`，Let's Encrypt 报 `Detail: no valid A records found for yangmaogeng.top`
- **根因**：ICP 备案和 DNS 解析是两个独立的阿里云产品/控制台：
  - ICP 备案 (<https://beian.aliyun.com>)——工信部审核域名合法性
  - 域名 DNS 解析 (<https://dns.console.aliyun.com>)——域名 → IP 映射，**需要手动加 A 记录**
  - 备案通过**只证明域名能用**，不代表"用户输入这个域名能访问到我的服务器"
- **修复位置**：
  1. 阿里云 DNS 控制台 → `yangmaogeng.top` → 解析设置 → 添加 A 记录（@ → ECS 公网 IP）
  2. `server/setup-ssl-certbot.sh` 第 2 步新增 DNS 预检（`dig` 拿到解析 IP，对比本机 `ifconfig.me` 的公网 IP），不一致直接 exit，避免浪费 Let's Encrypt 的 rate limit
- **预防**：任何"域名 → 服务器"类需求的最小检查清单——`dig +short <域名> @223.5.5.5` 必须返回**服务器的公网 IP**，否则后续一切都不用干。

### ⚠️ 小程序合法域名是 HTTPS，服务器必须先有 SSL 证书再切代码（2026-04-23）

- **现象**：域名 `yangmaogeng.top` 备案通过，小程序后台配了 `https://yangmaogeng.top` 为 request 合法域名。如果直接把 `miniprogram/app.js` 的 `baseUrl` 从 `http://47.114.89.50` 改成 `https://yangmaogeng.top`，服务器没证书的话小程序会全部 `request:fail`。
- **根因**：微信小程序强制 HTTPS，ICP 备案只证明域名合规≠有 SSL。三件事必须**按顺序**完成：
  1. 阿里云申请 + 下载免费 DV 证书（Nginx 版，得到 `.pem` 和 `.key`）
  2. 上传证书到服务器，`bash setup-ssl.sh` 配 Nginx 443 + HTTP 301 跳转
  3. `curl https://yangmaogeng.top/api/ships` 验证 200，**之后**才 push 前端代码
- **修复位置**：`server/setup-nginx.sh`（双模幂等）+ `server/setup-ssl.sh`（证书拷贝 + 校验 pem/key 匹配 + 调用 setup-nginx 切 HTTPS）
- **预防**：首次接入 HTTPS 的三层验证，参见本文件顶部「已完成」条目下的部署顺序。

### ⚠️ 硬编码 IP 地址散落在 6 个文件（2026-04-23）

- **现象**：换域名时发现 `http://47.114.89.50` 在 `miniprogram/app.js`、`admin/src/api/index.js`、4 个 vue/component 里都有硬编码；一处漏改就会导致图片 404 或 API 请求直接打到旧 IP。
- **根因**：早期为了"快速能跑"直接写 IP，没抽常量/环境变量。
- **修复**：
  - 管理后台改为相对路径 `/api` / `/uploads`（同域下零硬编码，未来换域名零改动）
  - 小程序因为脱离浏览器 origin，仍需绝对地址，集中在 `app.js` 单点
  - 用 `rg "47\.114\.89\.50"` 全项目验证零残留后才提交
- **预防**：见 `.cursor/rules/dev-workflow.mdc` 第 1 条"Mock-to-API 清零检查"同类思路——任何涉及后端地址的改动，必须 `rg` 全项目搜一遍，两端都改。

### ⚠️ 构建后忘记 commit admin/dist/（通用坑）

- **现象**：本地改了 admin 代码，`npm run build` 后直接 push，服务器 pull 拿不到新构建产物
- **根因**：`.gitignore` 默认 `/dist/`，需要 `!admin/dist/` 白名单才会追踪；且有时本地 `git status` 不会明显提示新文件
- **修复**：
  ```bash
  cd admin && npm run build
  git status                    # 确认 dist/ 变更
  git add admin/dist
  git commit -m "build: update admin dist"
  git show --stat HEAD          # 验证文件数量
  git push
  ```
  如果 `git add` 没效果，用 `git check-ignore -v admin/dist/<file>` 确认为何被忽略，必要时 `git add -f`
- **预防**：见 `.cursor/rules/dev-workflow.mdc` 第 5 条"构建产物提交前验证"

### ⚠️ 部署后只看 API 成功，不看前端（通用坑）

- **现象**：curl API 返回正确，但管理后台或小程序端显示旧数据 / 空白
- **根因**：Nginx 缓存、浏览器缓存、小程序未发布新版本、API 路径配置不一致
- **修复**：部署后强制做三层验证：
  1. `curl http://localhost:3000/api/xxx` 返回正确 JSON
  2. 浏览器刷新管理后台，数据与 curl 一致
  3. 小程序端展示与 API 一致（必要时开发者工具清缓存重进）
- **预防**：见 `.cursor/rules/dev-workflow.mdc` 第 6 条"部署后端到端验证"

---

<!-- 新条目追加到上方，保留历史记录 -->
