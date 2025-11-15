-- 创建数据库(如果还不存在)
CREATE DATABASE cesium_db;

-- 连接到新数据库
\c cesium_db;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 创建图层表
CREATE TABLE IF NOT EXISTS layers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    url TEXT,
    properties JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 创建示例数据
INSERT INTO layers (name, type, url, properties) 
VALUES 
    ('OpenStreetMap', 'imagery', 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', '{"attribution": "© OpenStreetMap contributors"}')
ON CONFLICT DO NOTHING;

-- 创建一个默认的管理员用户 (用户名: admin, 密码: admin123)
-- 注意: 实际部署时应该更改这个默认密码
INSERT INTO users (username, password, email, role)
VALUES ('admin', '$2b$10$rPvRh0zLTfSHg.QR1.JfVeVu3EpaR1UzNBJ94setV4xSSTg3WO7G2', 'admin@example.com', 'admin')
ON CONFLICT DO NOTHING;

-- 创建函数以自动更新更新时间
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER update_layers_updated_at
BEFORE UPDATE ON layers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- 存储管理相关表
CREATE TABLE IF NOT EXISTS storage_files (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'model', 'terrain', 'imagery', 'tileset'
    file_path VARCHAR(512) NOT NULL,
    file_size BIGINT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES users(id),
    is_public BOOLEAN DEFAULT false
);

-- 创建存储文件索引
CREATE INDEX IF NOT EXISTS idx_storage_files_type ON storage_files(type);
CREATE INDEX IF NOT EXISTS idx_storage_files_user_id ON storage_files(user_id);
CREATE INDEX IF NOT EXISTS idx_storage_files_is_public ON storage_files(is_public); 