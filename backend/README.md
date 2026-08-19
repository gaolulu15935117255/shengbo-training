# 圣博培训 V2.0 后端

Node.js + Express + MySQL 后端 API，对应 [V2.0 API 接口文档](../docs/V2.0-API接口文档.md) 与 [数据库设计](../docs/V2.0-数据库表结构设计.md)。

## 环境要求

- Node.js >= 18
- MySQL 8.0+

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，填入真实的 MySQL 连接信息与 JWT 密钥。**请勿将 `.env` 提交到 Git。**

| 变量 | 说明 |
|------|------|
| `DB_HOST` | MySQL 主机 |
| `DB_PORT` | 端口，默认 3306 |
| `DB_USER` | 数据库用户名 |
| `DB_PASSWORD` | 数据库密码 |
| `DB_NAME` | 库名，默认 `shengbo_training` |
| `JWT_SECRET` | 小程序用户 JWT 密钥 |
| `ADMIN_JWT_SECRET` | 后台管理员 JWT 密钥 |
| `PORT` | 服务端口，默认 3000 |

### 3. 初始化数据库

```bash
npm run init-db
```

该脚本会：

- 创建数据库与 28 张表（`sql/schema.sql`）
- 写入种子数据：角色、题库分类、示例商品（`sql/seed.sql`）
- 创建默认管理员：**admin / admin123**

### 4. 导入 V1 题库

```bash
npm run seed-questions
```

从 `../data/questions.js` 读取题目并写入数据库。

### 5. 启动服务

```bash
npm start
# 或开发模式（Node 18+ watch）
npm run dev
```

服务默认运行在 **http://localhost:3000**

健康检查：`GET /health`

## API 概览

### 小程序端（公开或 Bearer 用户 token）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 微信登录（mock openid） |
| GET | `/api/quiz/categories` | 题库分类 |
| GET | `/api/quiz/questions/ids` | 题目 ID 列表 |
| GET | `/api/products` | 商品列表 |
| GET | `/api/content/home` | 首页聚合 |

### 后台管理（Bearer admin token）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin/auth/login` | 管理员登录 |
| GET/POST/PUT/DELETE | `/api/admin/questions` | 题目 CRUD |
| PUT | `/api/admin/questions/batch-status` | 批量上下架 |
| POST | `/api/admin/quiz/import/preview` | 导入预览（xlsx/txt） |
| POST | `/api/admin/quiz/import/confirm` | 确认导入 |
| GET | `/api/admin/quiz/import/jobs/:id` | 导入任务状态 |
| GET/POST/PUT | `/api/admin/products` | 商品管理 |
| GET/POST | `/api/admin/orders` | 订单与退款 stub |
| GET/POST | `/api/admin/users` | 用户与手动开通权益 |
| GET | `/api/admin/dashboard/stats` | 仪表盘统计 |

### 管理员登录示例

```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

响应中的 `token` 用于后续请求的 `Authorization: Bearer <token>` 头。

## 题库导入格式

支持 **xlsx** 与 **txt**（制表符分隔）。

Excel 列名：

| 列 | 必填 | 说明 |
|----|------|------|
| 题型 | 是 | 单选/多选/判断 |
| 题干 | 是 | |
| 选项A~D | 是 | 判断题可留空（自动补正确/错误） |
| 答案 | 是 | A/B/C/D 或组合，如 `A,C` |
| 解析 | 否 | |
| 知识点 | 否 | |
| 子章节 | 否 | 按名称匹配子章节 |

## 目录结构

```
backend/
├── sql/
│   ├── schema.sql      # 28 张表 DDL
│   └── seed.sql        # 种子数据
├── scripts/
│   ├── init-db.js      # 初始化数据库
│   └── seed-questions.js
├── src/
│   ├── app.js          # 入口
│   ├── config/
│   ├── db/
│   ├── middleware/
│   ├── routes/
│   │   ├── admin/      # 后台 API
│   │   └── api/        # 小程序 API
│   └── utils/
├── .env.example
└── package.json
```

## 可选：挂载后台前端

若已构建管理端静态资源，可在 `.env` 中设置：

```
ADMIN_STATIC_DIR=../admin/dist
```

服务会自动托管该目录并支持 SPA 路由。

## 注意事项

- 微信登录、微信支付、OSS 上传等为 **stub/预留**，生产环境需对接真实服务。
- 金额统一使用 **分**（整数）存储。
- 生产环境请更换 JWT 密钥并使用 HTTPS。
