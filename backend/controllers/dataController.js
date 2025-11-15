const dataModel = require('../models/dataModel');

// 获取所有图层
const getAllLayers = async (req, res) => {
  try {
    console.log('正在获取所有图层...');
    const layers = await dataModel.getLayers();
    
    // 处理JSON数据，确保properties字段正确序列化
    const processedLayers = layers.map(layer => {
      try {
        // 如果properties已经是对象，不需要转换
        if (typeof layer.properties === 'object' && layer.properties !== null) {
          return layer;
        }
        
        // 如果properties是字符串，尝试解析
        if (typeof layer.properties === 'string') {
          try {
            layer.properties = JSON.parse(layer.properties);
          } catch (e) {
            console.warn(`无法解析图层 ${layer.id} 的properties字段:`, e);
            // 保持原样
          }
        }
        
        return layer;
      } catch (error) {
        console.error(`处理图层 ${layer.id} 时出错:`, error);
        return layer; // 返回原始图层
      }
    });
    
    console.log(`成功获取 ${processedLayers.length} 个图层`);
    res.status(200).json({
      success: true,
      count: processedLayers.length,
      data: processedLayers
    });
  } catch (error) {
    console.error('获取图层失败:', error);
    
    // 返回更详细的错误信息
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// 获取单个图层
const getLayer = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const layer = await dataModel.getLayerById(id);
    
    if (!layer) {
      return res.status(404).json({
        success: false,
        error: '找不到该图层'
      });
    }
    
    res.status(200).json({
      success: true,
      data: layer
    });
  } catch (error) {
    console.error('获取图层失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
};

// 创建新图层
const createLayer = async (req, res) => {
  try {
    const { name, type, url, properties } = req.body;
    
    // 简单验证
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: '请提供图层名称和类型'
      });
    }
    
    // 确保properties是一个有效的JSON对象
    let processedProperties = properties;
    if (typeof properties === 'string') {
      try {
        processedProperties = JSON.parse(properties);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: 'properties必须是有效的JSON格式'
        });
      }
    } else if (typeof properties !== 'object' || properties === null) {
      processedProperties = {};
    }
    
    // 检查URL是否已存在
    if (url) {
      const existingLayer = await dataModel.getLayerByUrl(url);
      if (existingLayer) {
        console.log(`URL为 ${url} 的图层已存在，返回现有图层`);
        return res.json({
          success: true,
          data: existingLayer,
          message: '此URL的图层已存在，返回现有图层'
        });
      }
    }
    
    const newLayer = await dataModel.createLayer({ 
      name, 
      type, 
      url, 
      properties: processedProperties 
    });
    
    res.status(201).json({
      success: true,
      data: newLayer
    });
  } catch (error) {
    console.error('创建图层失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: error.message
    });
  }
};

// 更新图层
const updateLayer = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, type, url, properties } = req.body;
    
    // 检查图层是否存在
    const layer = await dataModel.getLayerById(id);
    if (!layer) {
      return res.status(404).json({
        success: false,
        error: '找不到该图层'
      });
    }
    
    try {
      const updatedLayer = await dataModel.updateLayer(id, { 
        name: name || layer.name,
        type: type || layer.type,
        url: url || layer.url,
        properties: properties || layer.properties
      });
      
      res.status(200).json({
        success: true,
        data: updatedLayer
      });
    } catch (error) {
      // 检查是否是URL重复错误
      if (error.message && error.message.includes('URL已被其他图层使用')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      throw error; // 其他错误重新抛出
    }
  } catch (error) {
    console.error('更新图层失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误',
      message: error.message
    });
  }
};

// 删除图层
const deleteLayer = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // 检查图层是否存在
    const layer = await dataModel.getLayerById(id);
    if (!layer) {
      return res.status(404).json({
        success: false,
        error: '找不到该图层'
      });
    }
    
    await dataModel.deleteLayer(id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('删除图层失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
};

module.exports = {
  getAllLayers,
  getLayer,
  createLayer,
  updateLayer,
  deleteLayer
}; 