# 用户管理（user）

> 首次创建日期：2026-04-23（进度文档回填）
> 相关代码：
> - 后端：`server/routes/wx.js`（小程序登录）、`server/routes/admin.js`（管理员登录 + 用户管理）
> - 中间件：`server/middleware/auth.js`（JWT 鉴权）
> - 管理后台：`admin/src/views/user/`、`admin/src/views/login/`
> - 小程序：`miniprogram/pages/profile/`

## 已完成

- [x] 管理员账号登录（默认 admin / admin123，密码 bcrypt 加密存储）
- [x] JWT 鉴权中间件（`server/middleware/auth.js`）
- [x] 小程序微信登录（`server/routes/wx.js`）
- [x] 管理后台用户列表管理（`admin/src/views/user/`）
- [x] 小程序个人中心页（`miniprogram/pages/profile/`）

## 关键决策

- **两套身份系统分离**：管理员（`admins` 表） vs 小程序用户（`users` 表），不合并
- **小程序用户以 openid 为唯一标识**，不强制绑定手机号
- **JWT 不用 refresh token**：简化设计，token 过期后重新登录

## 已知限制 / 待办

- [ ] 管理员密码重置流程未实现（目前只能直接改数据库）
- [ ] 小程序用户头像 / 昵称更新流程需走微信隐私协议（见踩坑）

## 踩坑记录

### ⚠️ 微信小程序 chooseAvatar / nickname 报错或静默失败

- **现象**：`type="nickname"` 的 input 无响应，`chooseAvatar` 回调 timeout
- **根因**：微信基础库从 2.27 开始要求隐私协议声明，未配置会导致相关 API 失败
- **修复**：
  1. `miniprogram/app.json` 配置 `"__usePrivacyCheck__": true`
  2. 微信公众平台后台"用户隐私保护指引"中勾选 `chooseAvatar` / `nickname` 等接口
  3. 代码中处理 `wx.getPrivacySetting` + `agreePrivacyAuthorization` 流程
- **预防**：见 `.cursor/rules/dev-workflow.mdc` 第 3 条"平台级 API 失败：先查平台配置，再改代码"。**禁止**用 `type="text"` 绕过

---

<!-- 新条目追加到上方，保留历史记录 -->
