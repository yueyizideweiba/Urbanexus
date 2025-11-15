const pool = require('../config/db');

// 示例: 获取所有图层数据
const getLayers = async () => {
  try {
    console.log('查询数据库获取所有图层...');
    
    // 先检查表是否存在
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'layers'
      );
    `);
    
    const tableExists = checkTable.rows[0].exists;
    if (!tableExists) {
      console.error('layers表不存在，请运行初始化脚本');
      throw new Error('数据库表不存在，请先初始化数据库');
    }
    
    // 获取表结构信息
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'layers';
    `);
    
    console.log('表结构信息:', tableInfo.rows);
    
    // 执行查询
    const result = await pool.query('SELECT * FROM layers ORDER BY id ASC');
    console.log(`查询成功，获取到 ${result.rows.length} 条图层数据`);
    
    // 输出第一条数据的结构（如果存在）
    if (result.rows.length > 0) {
      console.log('第一条数据示例:', JSON.stringify(result.rows[0], null, 2));
    }
    
    return result.rows;
  } catch (error) {
    console.error('查询数据库失败:', error);
    
    // 检查是否为表不存在的错误
    if (error.code === '42P01') {
      console.error('错误: layers表不存在，请运行初始化脚本创建数据库');
      throw new Error('数据库表不存在，请先初始化数据库');
    }
    
    // 检查是否为连接错误
    if (error.code === 'ECONNREFUSED' || error.code === '28P01' || error.code === '3D000') {
      console.error('错误: 无法连接到数据库，请检查数据库配置和连接');
      throw new Error('数据库连接失败，请检查配置');
    }
    
    throw error;
  }
};

// 示例: 根据ID获取图层
const getLayerById = async (id) => {
  try {
    const result = await pool.query('SELECT * FROM layers WHERE id = $1', [id]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// 示例: 添加新图层
const createLayer = async (layerData) => {
  const { name, type, url, properties } = layerData;
  
  try {
    // 确保properties是适合PostgreSQL JSONB类型的格式
    let jsonProperties;
    
    if (typeof properties === 'string') {
      try {
        // 如果已经是JSON字符串，尝试解析确保有效
        jsonProperties = JSON.parse(properties);
        // 然后再字符串化以确保格式正确
        jsonProperties = JSON.stringify(jsonProperties);
      } catch (e) {
        console.error('无效的JSON字符串:', e);
        // 如果解析失败，使用空对象
        jsonProperties = '{}';
      }
    } else if (typeof properties === 'object' && properties !== null) {
      // 如果是对象，转换为JSON字符串
      jsonProperties = JSON.stringify(properties);
    } else {
      // 默认使用空对象
      jsonProperties = '{}';
    }
    
    console.log(`准备创建图层: ${name}, 类型: ${type}, properties: ${jsonProperties}`);
    
    const result = await pool.query(
      'INSERT INTO layers (name, type, url, properties) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, type, url, jsonProperties]
    );
    
    // 确保返回的对象中properties是JavaScript对象
    const newLayer = result.rows[0];
    if (typeof newLayer.properties === 'string') {
      try {
        newLayer.properties = JSON.parse(newLayer.properties);
      } catch (e) {
        console.warn('无法解析返回的properties字段:', e);
      }
    }
    
    return newLayer;
  } catch (error) {
    console.error('创建图层失败:', error);
    throw error;
  }
};

// 示例: 更新图层
const updateLayer = async (id, layerData) => {
  const { name, type, url, properties } = layerData;
  
  try {
    // 检查是否有其他图层使用相同URL
    if (url) {
      const result = await pool.query('SELECT * FROM layers WHERE url = $1 AND id != $2', [url, id]);
      if (result.rows.length > 0) {
        console.log(`URL为 ${url} 的图层已存在(ID=${result.rows[0].id})，不允许更新为重复URL`);
        throw new Error('该URL已被其他图层使用，请使用不同的URL');
      }
    }
    
    // 确保properties是适合PostgreSQL JSONB类型的格式
    let jsonProperties;
    
    if (typeof properties === 'string') {
      try {
        // 如果已经是JSON字符串，尝试解析确保有效
        jsonProperties = JSON.parse(properties);
        // 然后再字符串化以确保格式正确
        jsonProperties = JSON.stringify(jsonProperties);
      } catch (e) {
        console.error('无效的JSON字符串:', e);
        // 如果解析失败，使用空对象
        jsonProperties = '{}';
      }
    } else if (typeof properties === 'object' && properties !== null) {
      // 如果是对象，转换为JSON字符串
      jsonProperties = JSON.stringify(properties);
    } else {
      // 默认使用空对象
      jsonProperties = '{}';
    }
    
    console.log(`准备更新图层ID: ${id}, 名称: ${name}, 类型: ${type}`);
    
    const result = await pool.query(
      'UPDATE layers SET name = $1, type = $2, url = $3, properties = $4 WHERE id = $5 RETURNING *',
      [name, type, url, jsonProperties, id]
    );
    
    if (result.rows.length === 0) {
      throw new Error(`未找到ID为${id}的图层`);
    }
    
    // 确保返回的对象中properties是JavaScript对象
    const updatedLayer = result.rows[0];
    if (typeof updatedLayer.properties === 'string') {
      try {
        updatedLayer.properties = JSON.parse(updatedLayer.properties);
      } catch (e) {
        console.warn('无法解析返回的properties字段:', e);
      }
    }
    
    return updatedLayer;
  } catch (error) {
    console.error(`更新图层ID:${id}失败:`, error);
    throw error;
  }
};

// 示例: 删除图层
const deleteLayer = async (id) => {
  try {
    await pool.query('DELETE FROM layers WHERE id = $1', [id]);
    return { success: true };
  } catch (error) {
    throw error;
  }
};

// 根据URL查询图层
const getLayerByUrl = async (url) => {
  try {
    console.log(`根据URL查询图层: ${url}`);
    
    const result = await pool.query('SELECT * FROM layers WHERE url = $1', [url]);
    
    if (result.rows.length === 0) {
      console.log('未找到匹配的图层');
      return null;
    }
    
    const layer = result.rows[0];
    
    // 确保properties是对象
    if (typeof layer.properties === 'string') {
      try {
        layer.properties = JSON.parse(layer.properties);
      } catch (e) {
        console.warn('无法解析properties字段:', e);
      }
    }
    
    console.log(`找到匹配图层: ID=${layer.id}, 名称=${layer.name}`);
    return layer;
  } catch (error) {
    console.error('根据URL查询图层失败:', error);
    throw error;
  }
};

module.exports = {
  getLayers,
  getLayerById,
  createLayer,
  updateLayer,
  deleteLayer,
  getLayerByUrl
}; 