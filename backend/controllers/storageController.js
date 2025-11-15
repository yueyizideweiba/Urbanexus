const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const AdmZip = require('adm-zip');
const fsSync = require('fs');

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// 获取文件信息以加载到图层
const getFileForLayer = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // 查询文件信息
    const query = `
      SELECT sf.*, u.username 
      FROM storage_files sf
      LEFT JOIN users u ON sf.user_id = u.id
      WHERE sf.id = $1 AND (sf.is_public = true OR sf.user_id = $2)
    `;
    
    const result = await pool.query(query, [fileId, req.user?.id || null]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '文件不存在或无权访问'
      });
    }
    
    const file = result.rows[0];
    
    // 构建文件URL
    let fileUrl;
    
    // 对于3D Tiles类型的ZIP文件，我们需要指向解压后的tileset.json
    if (file.type === 'tileset' && file.file_path.endsWith('.zip')) {
      // 解压目录应该是以文件ID命名的文件夹
      const extractDir = path.join('uploads', `tileset_${file.id}`);
      fileUrl = `/uploads/tileset_${file.id}/tileset.json`;
    } else {
      fileUrl = `/uploads/${path.basename(file.file_path)}`;
    }
    
    res.json({
      success: true,
      data: {
        ...file,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('获取文件信息失败:', error);
    res.status(500).json({
      success: false,
      error: '获取文件信息失败'
    });
  }
};

// 获取当前用户的文件列表
const getCurrentUserFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 查询所有公开文件和当前用户的私有文件，并包含用户名信息
    const query = `
      SELECT sf.*, u.username 
      FROM storage_files sf
      LEFT JOIN users u ON sf.user_id = u.id
      WHERE sf.is_public = true 
      OR (sf.is_public = false AND sf.user_id = $1)
      ORDER BY sf.created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('获取文件列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取文件列表失败'
    });
  }
};

// 获取指定用户的文件列表
const getUserFiles = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, isPublic } = req.query;
    
    let query = 'SELECT * FROM storage_files WHERE user_id = $1';
    const params = [userId];
    
    if (type) {
      query += ' AND type = $2';
      params.push(type);
    }
    
    if (isPublic !== undefined) {
      query += ' AND is_public = $' + (params.length + 1);
      params.push(isPublic);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('获取文件列表失败:', error);
    res.status(500).json({ success: false, error: '获取文件列表失败' });
  }
};

// 处理3D Tiles ZIP文件解压
const extract3DTilesZip = async (zipFilePath, fileId) => {
  console.log(`开始解压3DTiles文件: ${zipFilePath}, fileId: ${fileId}`);
  try {
    // 创建解压目标目录
    const extractDir = path.join('uploads', `tileset_${fileId}`);
    console.log(`解压目标目录: ${extractDir}`);
    
    // 确保目录存在
    if (!fsSync.existsSync(extractDir)) {
      console.log(`创建目录: ${extractDir}`);
      await fs.mkdir(extractDir, { recursive: true });
    } else {
      console.log(`目录已存在: ${extractDir}`);
    }
    
    // 检查ZIP文件是否存在
    if (!fsSync.existsSync(zipFilePath)) {
      console.error(`ZIP文件不存在: ${zipFilePath}`);
      throw new Error(`ZIP文件不存在: ${zipFilePath}`);
    }
    
    // 解压ZIP文件
    console.log(`解压ZIP文件到: ${extractDir}`);
    const zip = new AdmZip(zipFilePath);
    const zipEntries = zip.getEntries();
    console.log(`ZIP文件包含 ${zipEntries.length} 个条目`);
    
    // 输出ZIP内容
    zipEntries.forEach((entry, index) => {
      if (index < 20) { // 只打印前20个条目，避免日志过大
        console.log(`  - ${entry.entryName} (${entry.isDirectory ? '目录' : '文件'})`);
      }
    });
    
    zip.extractAllTo(extractDir, true);
    console.log(`解压完成`);
    
    // 检查tileset.json是否存在
    const tilesetPath = path.join(extractDir, 'tileset.json');
    if (!fsSync.existsSync(tilesetPath)) {
      console.log(`根目录没有找到tileset.json, 开始在子目录中搜索`);
      // 如果根目录没有tileset.json，尝试在子目录中查找
      let foundTilesetPath = null;
      
      const findTileset = (dir, depth = 0) => {
        if (depth > 5) return; // 限制搜索深度，避免无限递归
        
        console.log(`搜索目录: ${dir} (深度: ${depth})`);
        const files = fsSync.readdirSync(dir);
        
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fsSync.statSync(fullPath);
          
          if (stat.isDirectory()) {
            findTileset(fullPath, depth + 1);
          } else if (file.toLowerCase() === 'tileset.json') {
            console.log(`找到tileset.json: ${fullPath}`);
            foundTilesetPath = fullPath;
            return;
          }
        }
      };
      
      findTileset(extractDir);
      
      if (foundTilesetPath) {
        console.log(`在子目录中找到tileset.json: ${foundTilesetPath}`);
        
        // 读取找到的tileset.json内容
        console.log(`读取tileset.json内容`);
        const tilesetContent = await fs.readFile(foundTilesetPath, 'utf8');
        
        // 尝试解析JSON以验证格式
        let tilesetData;
        try {
          tilesetData = JSON.parse(tilesetContent);
          console.log('成功解析tileset.json');
        } catch (error) {
          console.error('tileset.json不是有效的JSON格式:', error);
          throw new Error('找到的tileset.json不是有效的JSON格式');
        }
        
        // 验证是否是有效的3D Tiles格式
        if (!tilesetData.asset || !tilesetData.geometricError) {
          console.warn('找到的tileset.json似乎不是有效的3D Tiles格式，但将继续尝试使用');
        }
        
        // 计算tileset.json相对于解压目录的路径
        const relativePath = path.relative(path.dirname(foundTilesetPath), extractDir);
        
        // 处理tileset中的资源路径
        if (path.dirname(foundTilesetPath) !== extractDir) {
          console.log(`需要调整tileset.json中的资源路径`);
          
          // 根据需要调整路径
          if (tilesetData.root && tilesetData.root.content && tilesetData.root.content.uri) {
            const originalUri = tilesetData.root.content.uri;
            const adjustedUri = path.join(path.relative(extractDir, path.dirname(foundTilesetPath)), originalUri).replace(/\\/g, '/');
            tilesetData.root.content.uri = adjustedUri;
            console.log(`调整根内容URI: ${originalUri} -> ${adjustedUri}`);
          }
          
          // 更新后的JSON
          const updatedContent = JSON.stringify(tilesetData, null, 2);
          
          // 将处理后的内容写入根目录的tileset.json
          console.log(`将处理后的tileset.json写入根目录: ${tilesetPath}`);
          await fs.writeFile(tilesetPath, updatedContent, 'utf8');
        } else {
          // 直接复制到根目录
          console.log(`将tileset.json复制到根目录: ${tilesetPath}`);
          await fs.copyFile(foundTilesetPath, tilesetPath);
        }
      } else {
        // 没有找到tileset.json，尝试创建一个基本的
        console.error('未找到tileset.json文件');
        throw new Error('未找到tileset.json文件');
      }
    } else {
      console.log(`根目录已存在tileset.json: ${tilesetPath}`);
      
      // 验证格式
      try {
        const content = await fs.readFile(tilesetPath, 'utf8');
        const data = JSON.parse(content);
        if (!data.asset || !data.geometricError) {
          console.warn('现有tileset.json似乎不是有效的3D Tiles格式，但将继续尝试使用');
        } else {
          console.log('验证成功: tileset.json是有效的3D Tiles格式');
        }
      } catch (error) {
        console.error('验证tileset.json失败:', error);
        throw new Error('验证tileset.json失败: ' + error.message);
      }
    }
    
    console.log(`3D Tiles解压和处理完成，目录: ${extractDir}`);
    return extractDir;
  } catch (error) {
    console.error('解压3D Tiles文件失败:', error);
    throw error;
  }
};

// 上传文件
const uploadFile = async (req, res) => {
  try {
    const { name, type, isPublic } = req.body;
    const file = req.file;
    const userId = req.user.id;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        error: '未提供文件'
      });
    }
    
    // 插入文件记录到数据库
    const query = `
      INSERT INTO storage_files (name, type, file_path, file_size, user_id, is_public)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      name,
      type,
      file.path,
      file.size,
      userId,
      isPublic === 'true'
    ];
    
    const result = await pool.query(query, values);
    const savedFile = result.rows[0];
    
    // 如果是tileset类型并且是ZIP文件，则进行解压处理
    if (type === 'tileset' && path.extname(file.originalname).toLowerCase() === '.zip') {
      try {
        await extract3DTilesZip(file.path, savedFile.id);
      } catch (extractError) {
        console.error('处理3D Tiles文件失败:', extractError);
        // 如果解压失败，我们仍然保留原始ZIP文件
      }
    }
    
    res.json({
      success: true,
      data: savedFile
    });
  } catch (error) {
    console.error('上传文件失败:', error);
    res.status(500).json({
      success: false,
      error: '上传文件失败'
    });
  }
};

// 删除文件
const deleteFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const userId = req.user.id;
    
    // 首先检查文件是否存在且属于当前用户
    const checkQuery = `
      SELECT * FROM storage_files 
      WHERE id = $1 AND user_id = $2
    `;
    
    const checkResult = await pool.query(checkQuery, [fileId, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '文件不存在或无权限删除'
      });
    }
    
    const file = checkResult.rows[0];
    
    // 删除物理文件
    try {
      await fs.unlink(file.file_path);
      
      // 如果是tileset类型，需要删除解压的目录
      if (file.type === 'tileset' && file.file_path.endsWith('.zip')) {
        const extractDir = path.join('uploads', `tileset_${file.id}`);
        if (fsSync.existsSync(extractDir)) {
          // 递归删除目录
          const deleteFolderRecursive = async (dirPath) => {
            if (fsSync.existsSync(dirPath)) {
              const files = await fs.readdir(dirPath);
              for (const file of files) {
                const curPath = path.join(dirPath, file);
                const stat = await fs.stat(curPath);
                if (stat.isDirectory()) {
                  await deleteFolderRecursive(curPath);
                } else {
                  await fs.unlink(curPath);
                }
              }
              await fs.rmdir(dirPath);
            }
          };
          
          await deleteFolderRecursive(extractDir);
        }
      }
    } catch (unlinkError) {
      console.error('删除物理文件失败:', unlinkError);
      // 继续处理，即使物理文件删除失败
    }
    
    // 从数据库中删除记录
    const query = `
      DELETE FROM storage_files 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [fileId, userId]);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('删除文件失败:', error);
    res.status(500).json({
      success: false,
      error: '删除文件失败'
    });
  }
};

// 更新文件信息
const updateFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { name, isPublic } = req.body;
    const userId = req.user.id;
    
    // 首先检查文件是否存在且属于当前用户
    const checkQuery = `
      SELECT * FROM storage_files 
      WHERE id = $1 AND user_id = $2
    `;
    
    const checkResult = await pool.query(checkQuery, [fileId, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '文件不存在或无权限修改'
      });
    }
    
    const query = `
      UPDATE storage_files 
      SET name = $1, is_public = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND user_id = $4
      RETURNING *
    `;
    
    const values = [name, Boolean(isPublic), fileId, userId];
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('更新文件失败:', error);
    res.status(500).json({
      success: false,
      error: '更新文件失败'
    });
  }
};

module.exports = {
  uploadMiddleware: upload,
  getCurrentUserFiles,
  getUserFiles,
  uploadFile,
  deleteFile,
  updateFile,
  getFileForLayer
}; 