const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const apiRoutes = require('./routes/api');
const layerRoutes = require('./routes/layerRoutes');
const authRoutes = require('./routes/authRoutes');
const storageRoutes = require('./routes/storageRoutes');
const userRoutes = require('./routes/userRoutes');
const skyboxRoutes = require('./routes/skyboxes');
require('dotenv').config();

// 初始化Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码的请求体

// 静态文件服务 - 使用更高级的配置
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // 对于JSON文件设置正确的MIME类型
    if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
    // 对于其他3DTiles相关文件设置二进制MIME类型
    else if (filePath.endsWith('.b3dm') || 
             filePath.endsWith('.i3dm') || 
             filePath.endsWith('.pnts') || 
             filePath.endsWith('.cmpt')) {
      res.setHeader('Content-Type', 'application/octet-stream');
    }
    
    // 允许跨域请求的头部
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  }
}));

// 添加专门的3DTiles处理路由
app.get('/uploads/tileset_**/tileset.json', (req, res, next) => {
  console.log('请求3DTiles tileset.json:', req.path);
  
  const filePath = path.join(__dirname, req.path);
  
  // 检查文件是否存在
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('文件不存在:', filePath);
      return next(); // 继续到下一个处理器
    }
    
    // 读取文件内容
    fs.readFile(filePath, 'utf8', (readErr, data) => {
      if (readErr) {
        console.error('读取文件失败:', readErr);
        return next();
      }
      
      try {
        // 尝试解析JSON
        const jsonData = JSON.parse(data);
        
        // 设置正确的内容类型
        res.setHeader('Content-Type', 'application/json');
        // 允许跨域
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        // 发送JSON数据
        res.json(jsonData);
      } catch (jsonErr) {
        console.error('JSON解析失败:', jsonErr);
        // 直接发送文件内容
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
      }
    });
  });
});

// 基本路由
app.get('/', (req, res) => {
  res.json({ message: 'Cesium后端API服务已运行' });
});

// API路由
app.use('/api', apiRoutes);
app.use('/api/layers', layerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skyboxes', skyboxRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.stack);
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  });
});

// 处理404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '未找到请求的资源'
  });
});

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

module.exports = { app, server }; 