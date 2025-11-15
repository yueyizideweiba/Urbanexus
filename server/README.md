# Cesium后端服务器

这是一个用于Cesium应用的后端服务器，提供API接口和静态文件服务。

## 功能

- 提供Cesium数据图层管理API
- 用户认证和授权
- 文件存储和管理
- 3DTiles数据处理和服务

## 安装和运行

### 环境要求

- Node.js >= 14.x
- PostgreSQL >= 12.x

### 安装依赖

```bash
cd server
npm install
```

### 配置环境变量

将`.env.example`文件复制为`.env`并根据需要修改配置:

```bash
cp .env.example .env
```

### 初始化数据库

```bash
npm run init-db
```

### 启动服务器

开发模式:

```bash
npm run dev
```

生产模式:

```bash
npm start
```

## API文档

服务器启动后，可以访问以下主要API端点:

- `GET /` - 服务器状态检查
- `GET /api` - API概览
- `GET /api/layers` - 获取所有图层
- `POST /api/auth/login` - 用户登录
- `POST /api/storage/upload` - 上传文件

更多API详情请参考源代码或相关文档。

## 文件结构

```
server/
  ├── controllers/  - API控制器
  ├── models/       - 数据模型
  ├── routes/       - API路由
  ├── middleware/   - 中间件
  ├── scripts/      - 实用脚本
  ├── uploads/      - 上传文件存储
  ├── app.js        - 应用配置
  ├── index.js      - 入口文件
  └── README.md     - 说明文档
``` 