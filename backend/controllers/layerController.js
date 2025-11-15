const Layer = require('../models/layer');

// 获取所有图层
exports.getAllLayers = async (req, res) => {
  try {
    const layers = await Layer.getAll();
    res.json({
      success: true,
      data: layers
    });
  } catch (error) {
    console.error('获取图层失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误，请稍后再试'
    });
  }
};

// 获取单个图层
exports.getLayerById = async (req, res) => {
  try {
    const layer = await Layer.getById(req.params.id);
    if (!layer) {
      return res.status(404).json({
        success: false,
        error: '未找到该图层'
      });
    }
    res.json({
      success: true,
      data: layer
    });
  } catch (error) {
    console.error('获取图层失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误，请稍后再试'
    });
  }
};

// 创建新图层
exports.createLayer = async (req, res) => {
  try {
    const { name, type, url, properties } = req.body;
    
    // 验证必填字段
    if (!name || !type || !url) {
      return res.status(400).json({
        success: false,
        error: '名称、类型和URL都是必填项'
      });
    }
    
    // 检查URL是否已存在
    const existingLayer = await Layer.getByUrl(url);
    
    if (existingLayer) {
      console.log(`URL为 ${url} 的图层已存在，返回已存在的图层`);
      return res.json({
        success: true,
        data: existingLayer,
        message: '此URL的图层已存在，返回现有图层'
      });
    }
    
    const newLayer = await Layer.create({ name, type, url, properties });
    res.status(201).json({
      success: true,
      data: newLayer
    });
  } catch (error) {
    console.error('创建图层失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误，请稍后再试'
    });
  }
};

// 更新图层
exports.updateLayer = async (req, res) => {
  try {
    const { name, type, url, properties } = req.body;
    const id = req.params.id;
    
    // 检查图层是否存在
    const existingLayer = await Layer.getById(id);
    if (!existingLayer) {
      return res.status(404).json({
        success: false,
        error: '未找到该图层'
      });
    }
    
    try {
      const updatedLayer = await Layer.update(id, { name, type, url, properties });
      res.json({
        success: true,
        data: updatedLayer
      });
    } catch (error) {
      if (error.message && error.message.includes('URL已被其他图层使用')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('更新图层失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误，请稍后再试'
    });
  }
};

// 删除图层
exports.deleteLayer = async (req, res) => {
  try {
    const id = req.params.id;
    
    // 检查图层是否存在
    const existingLayer = await Layer.getById(id);
    if (!existingLayer) {
      return res.status(404).json({
        success: false,
        error: '未找到该图层'
      });
    }
    
    await Layer.delete(id);
    res.json({
      success: true,
      message: '图层已成功删除'
    });
  } catch (error) {
    console.error('删除图层失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误，请稍后再试'
    });
  }
}; 