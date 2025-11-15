const express = require('express');
const router = express.Router();
const layerController = require('../controllers/layerController');

// 获取所有图层
router.get('/', layerController.getAllLayers);

// 获取单个图层
router.get('/:id', layerController.getLayerById);

// 创建新图层
router.post('/', layerController.createLayer);

// 更新图层
router.put('/:id', layerController.updateLayer);

// 删除图层
router.delete('/:id', layerController.deleteLayer);

module.exports = router; 