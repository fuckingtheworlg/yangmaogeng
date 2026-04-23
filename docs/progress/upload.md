# 文件上传（upload）

> 首次创建日期：2026-04-23（进度文档回填）
> 相关代码：
> - 后端：`server/routes/upload.js`
> - 存储：`server/uploads/`（本地磁盘）
> - 静态服务：`server/app.js` 中 `app.use('/uploads', express.static(...))`

## 已完成

- [x] 基于 multer 的文件上传接口
- [x] Express 静态文件服务 `/uploads/*`
- [x] 管理后台船舶图片上传（`admin/src/views/ship/`）

## 关键决策

- **本地磁盘存储**：未使用 OSS / S3 等对象存储，图片走服务器本地磁盘，Nginx 映射 `/uploads/` 对外
- **文件名加时间戳防冲突**：上传时重命名为 `timestamp-random-原名`

## 已知限制 / 待办

- [ ] 无图片压缩 / 缩略图生成
- [ ] 无文件大小 / 类型白名单验证（multer 默认限制）
- [ ] 无 CDN 加速
- [ ] 无磁盘配额 / 清理策略

## 踩坑记录

### ⚠️ 上传成功但前端不显示图片（通用坑）

- **现象**：管理后台 / 小程序端上传接口返回 200，URL 能 curl 到，但浏览器 / 小程序不显示图片
- **根因**：
  - 开发环境 Vite 代理配置未覆盖 `/uploads/` 路径
  - 或小程序合法域名列表未加 uploads 域名
- **修复**：
  - admin：`vite.config.js` 的 `server.proxy` 要覆盖 `/uploads` 而不只是 `/api`
  - 小程序：微信后台配置 downloadFile 合法域名
  - 生产环境：Nginx 配置 `location /uploads/ { alias /path/to/server/uploads/; }`
- **预防**：用 `api-regression-test` skill 的 asset loading 排查流程（见 `~/.cursor/skills-cursor/api-regression-test/SKILL.md`）

---

<!-- 新条目追加到上方，保留历史记录 -->
