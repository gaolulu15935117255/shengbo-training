# 圣博培训 · 管理后台

基于 Vue 3 + Vite + Element Plus 构建的后台管理系统，用于题库、商品、订单与用户管理。

## 技术栈

- **Vue 3** — Composition API + `<script setup>`
- **Vite 6** — 开发与构建工具
- **Vue Router 4** — 路由与登录鉴权
- **Pinia** — 状态管理（认证 token）
- **Element Plus** — UI 组件库
- **Axios** — HTTP 请求封装

## 功能模块

| 页面 | 路径 | 说明 |
|------|------|------|
| 登录 | `/login` | 管理员账号密码登录 |
| 仪表盘 | `/dashboard` | 数据统计概览 |
| 题库管理 | `/questions` | 题目 CRUD、筛选、批量上下架 |
| 题库导入 | `/import` | Excel 上传预览与确认导入 |
| 商品管理 | `/products` | 商品列表、编辑、上下架 |
| 订单管理 | `/orders` | 订单列表、详情、退款 |
| 用户管理 | `/users` | 用户列表、详情、手动开通权益 |

## 快速开始

### 环境要求

- Node.js 18+
- 后端 API 服务运行在 `http://localhost:3000`

### 安装依赖

```bash
cd admin
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173 ，开发环境下 `/api` 请求会通过 Vite 代理转发至 `http://localhost:3000`。

### 生产构建

```bash
npm run build
```

构建产物输出至 `admin/dist/` 目录。

### 预览构建结果

```bash
npm run preview
```

## 项目结构

```
admin/
├── index.html              # 入口 HTML
├── vite.config.js          # Vite 配置（含 API 代理）
├── package.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.js             # 应用入口
    ├── App.vue
    ├── router/index.js     # 路由与鉴权守卫
    ├── stores/auth.js      # 认证状态（token 持久化）
    ├── utils/request.js    # Axios 封装（Bearer token、401 处理）
    ├── styles/index.css    # 全局样式与 Apple 风格主题
    ├── layouts/
    │   └── AdminLayout.vue # 侧边栏布局
    └── views/
        ├── Login.vue
        ├── Dashboard.vue
        ├── Questions.vue
        ├── Import.vue
        ├── Products.vue
        ├── Orders.vue
        └── Users.vue
```

## API 对接

所有请求通过 `src/utils/request.js` 统一处理：

- 自动在请求头附加 `Authorization: Bearer <token>`
- 响应 `code === 0` 时返回 `data` 字段
- `code === 40100` 或 HTTP 401 时清除 token 并跳转登录页

主要接口前缀：`/api/admin/`

| 模块 | 接口 |
|------|------|
| 登录 | `POST /api/admin/auth/login` |
| 仪表盘 | `GET /api/admin/dashboard/stats` |
| 题目 | `GET/POST/PUT/DELETE /api/admin/questions` |
| 导入 | `POST /api/admin/quiz/import/preview`、`/confirm` |
| 商品 | `GET/POST/PUT /api/admin/products` |
| 订单 | `GET /api/admin/orders`、`POST .../refund` |
| 用户 | `GET /api/admin/users`、`POST .../grant` |

## 主题设计

采用 Apple 风格浅色主题，与小程序端视觉保持一致：

- 背景色：`#F2F2F7`
- 主色调：`#007AFF`
- 圆角卡片 + 轻阴影
- 系统字体栈（PingFang SC / Microsoft YaHei）

## 部署说明

1. 执行 `npm run build` 生成 `dist/` 目录
2. 将 `dist/` 部署至 Nginx 或其他静态服务器
3. 配置反向代理，将 `/api` 转发至后端服务

Nginx 示例：

```nginx
location /api {
    proxy_pass http://localhost:3000;
}

location / {
    root /path/to/admin/dist;
    try_files $uri $uri/ /index.html;
}
```

## 许可证

内部项目，仅供圣博培训使用。
