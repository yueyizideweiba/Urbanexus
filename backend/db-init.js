const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 从.env文件获取数据库配置
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'cesium_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
};

console.log('数据库配置:', {
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  port: dbConfig.port,
  // 出于安全考虑不显示密码
});

async function initDb() {
  try {
    // 先连接到默认数据库以创建目标数据库
    const pgPool = new Pool({
      ...dbConfig,
      database: 'postgres' // 连接到默认数据库
    });

    try {
      // 检查目标数据库是否已存在
      const dbCheckResult = await pgPool.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [dbConfig.database]
      );

      // 如果数据库不存在，则创建它
      if (dbCheckResult.rows.length === 0) {
        console.log(`创建数据库 ${dbConfig.database}...`);
        await pgPool.query(`CREATE DATABASE ${dbConfig.database}`);
        console.log(`数据库 ${dbConfig.database} 创建成功`);
      } else {
        console.log(`数据库 ${dbConfig.database} 已存在`);
      }
    } finally {
      // 关闭连接到postgres的连接池
      await pgPool.end();
    }

    // 连接到目标数据库
    console.log(`正在连接到数据库 ${dbConfig.database}...`);
    const targetPool = new Pool(dbConfig);

    try {
      // 检查users表是否存在
      const usersTableCheckResult = await targetPool.query(`
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      `);

      // 如果users表不存在，则创建它
      if (usersTableCheckResult.rows.length === 0) {
        console.log('创建users表...');
        
        // 创建users表
        await targetPool.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        console.log('users表创建成功');
      } else {
        console.log('users表已存在');
        
        // 显示现有数据
        const countResult = await targetPool.query('SELECT COUNT(*) FROM users');
        console.log(`users表包含 ${countResult.rows[0].count} 条记录`);
      }

      // 检查layers表是否存在
      const layersTableCheckResult = await targetPool.query(`
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'layers'
      `);

      // 如果layers表不存在，则创建它
      if (layersTableCheckResult.rows.length === 0) {
        console.log('创建layers表...');
        
        // 创建表
        await targetPool.query(`
          CREATE TABLE IF NOT EXISTS layers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL,
            url TEXT,
            properties JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // 创建更新触发器
        await targetPool.query(`
          CREATE OR REPLACE FUNCTION update_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql
        `);
        
        await targetPool.query(`
          DROP TRIGGER IF EXISTS update_layers_updated_at ON layers;
          CREATE TRIGGER update_layers_updated_at
          BEFORE UPDATE ON layers
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at()
        `);
        
        console.log('layers表和触发器创建成功');
        
        // 插入示例数据
        console.log('添加示例数据...');
        await targetPool.query(`
          INSERT INTO layers (name, type, url, properties) VALUES
          ('OpenStreetMap', 'imagery', 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', '{"attribution": "© OpenStreetMap contributors"}'),
          ('武汉建筑', '3dtiles', 'https://example.com/3dtiles/wuhan/tileset.json', '{"maximumScreenSpaceError": 16, "maximumMemoryUsage": 512}'),
          ('武汉市区边界', 'geojson', 'https://example.com/data/wuhan_boundary.geojson', '{"stroke": "#FF0000", "strokeWidth": 3, "fill": "#FF0000"}')
        `);
        
        console.log('示例数据添加成功');
      } else {
        console.log('layers表已存在');
        
        // 显示现有数据
        const countResult = await targetPool.query('SELECT COUNT(*) FROM layers');
        console.log(`layers表包含 ${countResult.rows[0].count} 条记录`);
      }
      
      console.log('✅ 数据库初始化成功');
    } catch (error) {
      console.error('初始化表时出错:', error);
      throw error;
    } finally {
      await targetPool.end();
    }
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

initDb();