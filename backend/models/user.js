const pool = require('../config/db');
const bcrypt = require('bcrypt');

class User {
  // 根据ID获取用户
  static async getById(id) {
    try {
      const result = await pool.query('SELECT id, username, email, role, created_at FROM users WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('获取用户失败:', error);
      if (error.code === '42P01') {
        throw new Error('用户表不存在，请先初始化数据库');
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error('无法连接到数据库，请检查数据库配置');
      }
      throw error;
    }
  }

  // 根据用户名获取用户
  static async getByUsername(username) {
    try {
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('获取用户失败:', error);
      if (error.code === '42P01') {
        throw new Error('用户表不存在，请先初始化数据库');
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error('无法连接到数据库，请检查数据库配置');
      }
      throw error;
    }
  }

  // 创建用户
  static async create(userData) {
    try {
      // 加密密码
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // 设置默认角色为user，除非明确指定
      const role = userData.role || 'user';
      
      const result = await pool.query(
        'INSERT INTO users (username, password, email, role, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, username, email, role, created_at',
        [userData.username, hashedPassword, userData.email, role]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('创建用户失败:', error);
      if (error.code === '23505') { // 唯一约束违反
        if (error.constraint === 'users_username_key') {
          throw new Error('该用户名已被使用');
        }
        if (error.constraint === 'users_email_key') {
          throw new Error('该邮箱已被使用');
        }
      }
      if (error.code === '42P01') {
        throw new Error('用户表不存在，请先初始化数据库');
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error('无法连接到数据库，请检查数据库配置');
      }
      throw error;
    }
  }

  // 验证密码
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('密码验证失败:', error);
      throw error;
    }
  }

  // 检查用户名是否已存在
  static async usernameExists(username) {
    try {
      const result = await pool.query('SELECT COUNT(*) FROM users WHERE username = $1', [username]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error('检查用户名失败:', error);
      if (error.code === '42P01') {
        throw new Error('用户表不存在，请先初始化数据库');
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error('无法连接到数据库，请检查数据库配置');
      }
      throw error;
    }
  }

  // 检查邮箱是否已存在
  static async emailExists(email) {
    try {
      const result = await pool.query('SELECT COUNT(*) FROM users WHERE email = $1', [email]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error('检查邮箱失败:', error);
      if (error.code === '42P01') {
        throw new Error('用户表不存在，请先初始化数据库');
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error('无法连接到数据库，请检查数据库配置');
      }
      throw error;
    }
  }

  // 获取所有用户
  static async getAll() {
    try {
      const result = await pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC');
      return result.rows;
    } catch (error) {
      console.error('获取所有用户失败:', error);
      if (error.code === '42P01') {
        throw new Error('用户表不存在，请先初始化数据库');
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error('无法连接到数据库，请检查数据库配置');
      }
      throw error;
    }
  }

  // 更新用户
  static async update(id, userData) {
    try {
      const updates = [];
      const values = [];
      let query = 'UPDATE users SET ';
      
      // 仅更新提供的字段
      if (userData.username) {
        updates.push(`username = $${updates.length + 1}`);
        values.push(userData.username);
      }
      
      if (userData.email) {
        updates.push(`email = $${updates.length + 1}`);
        values.push(userData.email);
      }
      
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        updates.push(`password = $${updates.length + 1}`);
        values.push(hashedPassword);
      }
      
      if (userData.role) {
        updates.push(`role = $${updates.length + 1}`);
        values.push(userData.role);
      }
      
      // 如果没有任何更新，返回null
      if (updates.length === 0) {
        return null;
      }
      
      query += updates.join(', ') + ` WHERE id = $${updates.length + 1} RETURNING id, username, email, role, created_at`;
      values.push(id);
      
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('更新用户失败:', error);
      if (error.code === '23505') { // 唯一约束违反
        if (error.constraint === 'users_username_key') {
          throw new Error('该用户名已被使用');
        }
        if (error.constraint === 'users_email_key') {
          throw new Error('该邮箱已被使用');
        }
      }
      throw error;
    }
  }

  // 删除用户
  static async delete(id) {
    try {
      const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('删除用户失败:', error);
      throw error;
    }
  }

  // 检查用户是否为管理员
  static async isAdmin(id) {
    try {
      const result = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
      return result.rows[0] && result.rows[0].role === 'admin';
    } catch (error) {
      console.error('检查用户角色失败:', error);
      throw error;
    }
  }
}

module.exports = User; 