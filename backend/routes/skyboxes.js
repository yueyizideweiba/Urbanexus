const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

/**
 * GET /api/skyboxes
 * 获取public/skybox目录下所有文件夹名称列表
 */
router.get('/', (req, res) => {
  try {
    const skyboxPath = path.join(process.cwd(), '..', 'public', 'skybox');
    
    // 确保目录存在
    if (!fs.existsSync(skyboxPath)) {
      console.warn(`天空盒目录不存在: ${skyboxPath}`);
      return res.json(['default', 'bluesky', 'sunset']);
    }
    
    // 读取目录内容
    const items = fs.readdirSync(skyboxPath, { withFileTypes: true });
    
    // 过滤出文件夹
    const skyboxes = items
      .filter(item => item.isDirectory())
      .map(item => item.name);
    
    // 添加默认天空盒
    if (!skyboxes.includes('default')) {
      skyboxes.unshift('default');
    }
    
    console.log('找到天空盒:', skyboxes);
    res.json(skyboxes);
  } catch (error) {
    console.error('获取天空盒列表出错:', error);
    res.status(500).json({ error: '获取天空盒列表失败', message: error.message });
  }
});

module.exports = router; 