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
- [x] 小程序微信登录（`server/routes/wx.js`，2026-04-24 起接入真实 `jscode2session`）
- [x] 管理后台用户列表管理（`admin/src/views/user/`）
- [x] 小程序个人中心页（`miniprogram/pages/profile/`）

## 关键决策

- **两套身份系统分离**：管理员（`admins` 表） vs 小程序用户（`users` 表），不合并
- **小程序用户以 openid 为唯一标识**，不强制绑定手机号
- **JWT 不用 refresh token**：简化设计，token 过期后重新登录
- **openid 换取走 Node 18 原生 fetch**：不引入 axios，`server/routes/wx.js` 的 `exchangeOpenid` 函数集中处理 `jscode2session` 调用与错误分类

## 已知限制 / 待办

- [ ] 管理员密码重置流程未实现（目前只能直接改数据库）
- [ ] 小程序用户头像 / 昵称更新流程需走微信隐私协议（见踩坑）
- [ ] 登录失败时给前端的文案目前直接透传微信 `errcode`（便于调试），上线前可包装成友好提示

## 踩坑记录

### ⚠️ 2026-04-25 真机 `chooseAvatar` 返回后登录弹窗自动关闭

- **现象**：真机上点击"使用微信头像"后，头像 / 昵称输入框所在的登录弹窗直接消失，用户无法继续选择昵称和确认登录
- **根因**：登录遮罩层 `login-mask` 绑定了 `bindtap="closeLoginModal"`，内部弹窗 `login-modal` 写的是空 `catchtap=""`。真机原生 `chooseAvatar` 弹层返回后，点击事件冒泡到遮罩层，触发关闭
- **修复**：
  1. 去掉 `login-mask` 的点击关闭行为，只允许用户点击"取消"关闭登录弹窗
  2. `login-modal` 改成 `catchtap="noop"`，用明确的空处理函数阻止冒泡，避免空 handler 在真机行为不稳定
- **预防**：涉及 `chooseAvatar` / `agreePrivacyAuthorization` 这类原生弹层时，不要依赖遮罩点击关闭；弹窗内层必须使用真实 handler 做 `catchtap`

### ⚠️ 2026-04-24 真机登录两个深坑：onLogin 清空 state + 头像存本地临时路径

- **现象**：真机上选完头像后看起来"没反应"，反复点"点击登录"都无法登录
- **日志特征**：`onLogin` 被调用 4 次，`onChooseAvatar` 成功触发并拿到 `wxfile://tmp_xxx.jpg`，但没有任何 `[CONFIRM-*]` 日志（用户从未真正走到确认登录这一步）
- **双重根因**：
  1. **前端 state 重置 bug**：`profile.js:onLogin` 每次都 `setData({ tempAvatar: '', tempNickname: '' })`，用户误触背景重开弹窗会清空已选的头像/昵称
  2. **头像存储设计 bug**：`<button open-type="chooseAvatar">` 回调返回的 `wxfile://tmp_xxx.jpg` 是**手机本地临时路径**，别人看不到、自己清缓存也没了；之前代码直接把这个字符串存到 `users.avatar`，等于没存
- **修复**：
  1. `onLogin` 不再清空 `tempAvatar/tempNickname`，只有登录成功和主动登出时清
  2. `confirmLogin` 新增 `_uploadAvatarIfLocal` 步骤：调 `wx.uploadFile → POST /api/upload` 先把头像上传成 `https://yangmaogeng.top/uploads/xxx.jpg` 永久 URL，再传给 `/wx/login` 存库
  3. 已登录过一次的 `avatarUrl`（https 开头）不重复上传，直接复用
- **关于日志噪音（纯背景，非 bug）**：`not node js file system!path:/saaa_config.json`、`no such file 'wxfile://sdk/session.../better_log_persist.log'`、`backgroundfetch privacy fail (errno:101)` 均为微信 SDK 真机内部警告，每个项目都有，可完全忽略

### ⚠️ 2026-04-24 后端 `mock_openid_${code}` 导致同一用户反复生成新账号

- **现象**：切换到真实 AppID/AppSecret 前，每次 `wx.login` 都会让 `users` 表多一条记录
- **根因**：`server/routes/wx.js` 旧实现 `const openid = mock_openid_${code}`，而 `code` 是一次性的，每次都不同 → 同一微信号对应无数 openid → 无数用户行
- **修复**：
  1. `server/.env` 配置真实 `WX_APPID` 和 `WX_SECRET`（AppSecret 在微信公众平台「开发管理 → 开发设置」获取，一次可见，请本地保存）
  2. `wx.js` 新增 `exchangeOpenid(code)` 函数，用 Node 18 原生 `fetch` 调用 `https://api.weixin.qq.com/sns/jscode2session` 换真实 openid，失败直接返回 `code: 401`
  3. 一次性清理脚本：`server/config/cleanup-mock-openids.sql`（先查规模再 DELETE，级联 CASCADE + SET NULL 已处理外键）
- **预防**：AppSecret 绝不进 git（`.gitignore` 第 4 行已忽略 `.env`）；服务器端 `.env` 要单独同步，不从 git 拉取

### ⚠️ 2026-04-24 登录弹窗 UX：开发者工具里 `type="nickname"` 不弹"使用微信昵称"按钮

- **现象**：审核通过后，在微信开发者工具里选完头像，点"确认登录"无反应
- **根因**：
  1. 开发者工具里 `<input type="nickname">` 的"使用微信昵称"快捷按钮**通常不会弹出**（平台已知限制），只能手动键盘输入，但用户以为是 bug
  2. "请填写昵称"toast 默认 1.5s，用户容易错过
- **修复**：
  1. 弹窗副标题改成"点击下方选择微信头像和昵称"
  2. 昵称输入框下方加一行小字：真机上点击会弹"使用微信昵称"按钮；开发者工具需手动输入
  3. toast 延长到 2500ms
  4. 头像也纳入必选校验（之前只校验昵称，头像为空也能登录）
  5. `confirmLogin` 全链路加 `[DEBUG-3ffe2d]` 日志，方便下次排查
- **预防**：登录类 UX 要**真机测试**才算完整；开发者工具里只能验证到"代码是否能跑通"，弹层行为必须真机才能复现

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
