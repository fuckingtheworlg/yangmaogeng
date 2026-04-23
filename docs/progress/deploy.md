# 部署与运维（deploy）

> 首次创建日期：2026-04-23（进度文档回填）
> 相关代码：
> - `server/deploy.sh`
> - `server/setup-nginx.sh`
> - `admin/dist/`（需提交到 git，详见下方）

## 已完成

- [x] 后端部署脚本（`server/deploy.sh`）
- [x] Nginx 配置脚本（`server/setup-nginx.sh`）
- [x] 管理后台 dist/ 提交到 git（`.gitignore` 有 `!admin/dist/` 白名单）

## 关键决策

- **dist/ 进 git**：不在服务器上构建，本地构建后把 `admin/dist/` 一并 commit + push，服务器 pull 即可更新前端。理由：服务器资源有限，避免 node_modules 体积和构建失败风险。
- **前端静态资源由 Nginx 直接服务**，不走 Node。API 请求由 Nginx 反向代理到 `localhost:3000`
- **上传文件本地存储**：`server/uploads/`，Nginx 映射到 `/uploads/` 路径

## 已知限制 / 待办

- [ ] 未使用 PM2 / systemd 做进程守护（目前可能依赖手动 `npm start` + screen）
- [ ] 无自动化 CI/CD，全部手动
- [ ] 无备份策略（数据库 + uploads/）
- [ ] 无监控告警

## 踩坑记录

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
