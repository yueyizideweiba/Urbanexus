const pool = require('../config/db');

class Layer {
  // 获取所有图层
  static async getAll() {
    try {
      const result = await pool.query('SELECT * FROM layers ORDER BY created_at DESC');
      return result.rows;
    } catch (error) {
      console.error('获取图层失败:', error);
      throw error;
    }
  }

  // 根据ID获取图层
  static async getById(id) {
    try {
      const result = await pool.query('SELECT * FROM layers WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('获取图层失败:', error);
      throw error;
    }
  }
  
  // 根据URL查找图层
  static async getByUrl(url) {
    try {
      const result = await pool.query('SELECT * FROM layers WHERE url = $1', [url]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('根据URL查找图层失败:', error);
      throw error;
    }
  }

  // 创建图层
  static async create(layerData) {
    try {
      const { name, type, url, properties } = layerData;
      
      // 检查URL是否已存在
      const existingLayer = await this.getByUrl(url);
      if (existingLayer) {
        console.log(`URL为 ${url} 的图层已存在，不重复添加`);
        return existingLayer; // 返回已存在的图层信息
      }
      
      const propertiesJson = properties ? JSON.stringify(properties) : null;
      
      const result = await pool.query(
        'INSERT INTO layers (name, type, url, properties, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
        [name, type, url, propertiesJson]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('创建图层失败:', error);
      throw error;
    }
  }

  // 更新图层
  static async update(id, layerData) {
    try {
      const { name, type, url, properties } = layerData;
      
      // 检查是否有其他图层使用相同URL
      if (url) {
        const result = await pool.query('SELECT * FROM layers WHERE url = $1 AND id != $2', [url, id]);
        if (result.rows.length > 0) {
          console.log(`URL为 ${url} 的图层已存在，不允许更新为重复URL`);
          throw new Error('该URL已被其他图层使用，请使用不同的URL');
        }
      }
      
      const propertiesJson = properties ? JSON.stringify(properties) : null;
      
      const result = await pool.query(
        'UPDATE layers SET name = $1, type = $2, url = $3, properties = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
        [name, type, url, propertiesJson, id]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('更新图层失败:', error);
      throw error;
    }
  }

  // 删除图层
  static async delete(id) {
    try {
      await pool.query('DELETE FROM layers WHERE id = $1', [id]);
      return true;
    } catch (error) {
      console.error('删除图层失败:', error);
      throw error;
    }
  }
}

module.exports = Layer; 