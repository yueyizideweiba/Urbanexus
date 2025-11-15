const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const storageController = require('../controllers/storageController');

// 获取当前用户的文件列表
router.get('/user/current', verifyToken, storageController.getCurrentUserFiles);

// 获取指定用户的文件列表
router.get('/user/:userId', verifyToken, storageController.getUserFiles);

// 获取文件信息以加载到图层
router.get('/file/:fileId', verifyToken, storageController.getFileForLayer);

// 上传文件
router.post('/upload', 
  verifyToken,
  storageController.uploadMiddleware.single('file'),
  storageController.uploadFile
);

// 删除文件
router.delete('/:fileId', verifyToken, storageController.deleteFile);

// 更新文件信息
router.put('/:fileId', verifyToken, storageController.updateFile);

module.exports = router; 