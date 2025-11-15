# Cesium 应用后端服务

这是一个基于 Node.js、Express 和 PostgreSQL 的后端服务，为 Cesium 3D 地图应用提供数据支持。

## 项目结构

```
backend/
  ├── config/          # 配置文件
  ├── controllers/     # 控制器
  ├── models/          # 数据模型
  ├── routes/          # API路由
  ├── .env             # 环境变量
  ├── db_init.sql      # 数据库初始化脚本
  ├── package.json     # 项目依赖
  ├── README.md        # 项目说明
  └── server.js        # 服务器入口文件
```

## 开始使用

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

修改 `.env` 文件中的数据库连接信息和其他配置。

### 3. 初始化数据库

```bash
# 登录PostgreSQL
psql -U postgres

# 运行初始化脚本
\i db_init.sql
```

### 4. 启动服务器

```bash
npm start
```

默认情况下，服务器将在 http://localhost:3000 上运行。

## API 端点

### 图层 API

- `GET /api/layers` - 获取所有图层
- `GET /api/layers/:id` - 获取指定ID的图层
- `POST /api/layers` - 创建新图层
- `PUT /api/layers/:id` - 更新图层
- `DELETE /api/layers/:id` - 删除图层

## 数据库模型

### 图层表 (layers)

| 字段 | 类型 | 描述 |
|------|------|------|
| id | SERIAL | 主键 |
| name | VARCHAR(255) | 图层名称 |
| type | VARCHAR(50) | 图层类型 (imagery, geojson, 3dtiles, etc.) |
| url | TEXT | 图层URL |
| properties | JSONB | 其他图层属性 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 | 