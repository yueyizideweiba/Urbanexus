const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

// API根路由 - 提供API信息
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Cesium API服务',
    version: '1.0.0',
    endpoints: [
      '/api/layers - 图层管理',
      '/api/auth - 用户认证',
      '/api/storage - 存储服务'
    ]
  });
});

// 图层API路由
router.get('/layers', dataController.getAllLayers);
router.get('/layers/:id', dataController.getLayer);
router.post('/layers', dataController.createLayer);
router.put('/layers/:id', dataController.updateLayer);
router.delete('/layers/:id', dataController.deleteLayer);

module.exports = router; 