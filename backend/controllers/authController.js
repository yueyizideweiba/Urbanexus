const User = require('../models/user');
const jwt = require('jsonwebtoken');

// 注册新用户
exports.register = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // 验证必填字段
    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        error: '用户名、密码和邮箱都是必填项'
      });
    }

    // 检查用户名长度
    if (username.length < 4) {
      return res.status(400).json({
        success: false,
        error: '用户名长度至少需要4个字符'
      });
    }

    // 检查密码长度
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: '密码长度至少需要6个字符'
      });
    }

    // 检查邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: '请输入有效的邮箱地址'
      });
    }

    try {
      // 检查用户名是否已存在
      const usernameExists = await User.usernameExists(username);
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          error: '该用户名已被使用'
        });
      }

      // 检查邮箱是否已存在
      const emailExists = await User.emailExists(email);
      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: '该邮箱已被使用'
        });
      }

      // 创建新用户
      const newUser = await User.create({ username, password, email });

      res.status(201).json({
        success: true,
        message: '注册成功',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email
        }
      });
    } catch (error) {
      // 处理数据库相关错误
      if (error.message.includes('用户表不存在')) {
        return res.status(500).json({
          success: false,
          error: '系统错误：数据库未初始化，请联系管理员'
        });
      }
      if (error.message.includes('无法连接到数据库')) {
        return res.status(500).json({
          success: false,
          error: '系统错误：无法连接到数据库，请联系管理员'
        });
      }
      if (error.message.includes('已被使用')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      throw error; // 重新抛出其他未处理的错误
    }
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误，请稍后再试'
    });
  }
};

// 用户登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '请提供用户名和密码'
      });
    }

    try {
      // 查找用户
      const user = await User.getByUsername(username);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: '用户名或密码错误'
        });
      }

      // 验证密码
      const isPasswordValid = await User.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: '用户名或密码错误'
        });
      }

      // 创建JWT令牌
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.status(200).json({
        success: true,
        message: '登录成功',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      });
    } catch (error) {
      // 处理数据库相关错误
      if (error.message.includes('用户表不存在')) {
        return res.status(500).json({
          success: false,
          error: '系统错误：数据库未初始化，请联系管理员'
        });
      }
      if (error.message.includes('无法连接到数据库')) {
        return res.status(500).json({
          success: false,
          error: '系统错误：无法连接到数据库，请联系管理员'
        });
      }
      throw error; // 重新抛出其他未处理的错误
    }
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误，请稍后再试'
    });
  }
}; 