# 羊毛梗船舶服务中心信息发布平台

船舶信息展示、出售和管理平台，包含微信小程序（用户端）和 Web 管理后台（管理员端）。

## 项目结构

```
yaomaogeng/
├── miniprogram/    # 微信小程序（原生开发）
├── admin/          # Vue3 + Element Plus 管理后台
└── server/         # Node.js + Express 后端 API
```

## 技术栈

- **小程序**: 原生微信小程序 (WXML + WXSS + JS)
- **管理后台**: Vue 3 + Element Plus + Vue Router
- **后端**: Node.js + Express 5
- **数据库**: MySQL

## 快速开始

### 1. 数据库初始化

```bash
mysql -u root -p < server/config/init.sql
```

### 2. 启动后端

```bash
cd server
cp .env.example .env  # 修改数据库配置
npm install
npm run dev
```

### 3. 启动管理后台

```bash
cd admin
npm install
npm run dev
```

管理员账号: admin / admin123

### 4. 小程序

用微信开发者工具导入 `miniprogram/` 目录即可预览。

## 功能说明

### 小程序端
- 首页：船舶列表浏览、吨位筛选、搜索
- 详情：船舶详细参数、图片、收藏、联系方式
- 委托：出售/购买委托表单提交
- 我的：收藏列表、委托记录

### 管理后台
- 船舶数据管理（CRUD + 筛选）
- 用户数据管理
- 委托请求管理（购买/出售分类）
- 交易记录管理
