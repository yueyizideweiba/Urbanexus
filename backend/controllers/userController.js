const User = require('../models/user');

// 获取所有用户
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    
    // 不返回密码
    const safeUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    }));
    
    res.status(200).json({
      success: true,
      data: safeUsers
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误，请稍后再试'
    });
  }
};

// 获取单个用户
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // 检查用户ID
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '用户ID是必需的'
      });
    }
    
    const user = await User.getById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '找不到该用户'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('获取用户失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误，请稍后再试'
    });
  }
};

// 更新用户
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    
    // 检查用户ID
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '用户ID是必需的'
      });
    }
    
    // 检查要更新的内容
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: '没有提供任何更新内容'
      });
    }
    
    // 检查用户是否存在
    const existingUser = await User.getById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: '找不到该用户'
      });
    }
    
    // 如果是管理员账户，且操作者不是该管理员自己，则限制修改角色
    if (existingUser.role === 'admin' && existingUser.id !== req.user.id && updates.role === 'user') {
      return res.status(403).json({
        success: false,
        error: '无法降级其他管理员的权限'
      });
    }
    
    // 更新用户
    const updatedUser = await User.update(userId, updates);
    
    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        error: '更新用户失败'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '用户已成功更新',
      data: updatedUser
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    
    // 处理特定错误
    if (error.message.includes('已被使用')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: '服务器错误，请稍后再试'
    });
  }
};

// 删除用户
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // 检查用户ID
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '用户ID是必需的'
      });
    }
    
    // 检查用户是否存在
    const existingUser = await User.getById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: '找不到该用户'
      });
    }
    
    // 防止管理员删除自己
    if (existingUser.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: '管理员不能删除自己的账户'
      });
    }
    
    // 防止删除其他管理员账户
    if (existingUser.role === 'admin' && existingUser.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: '无法删除其他管理员账户'
      });
    }
    
    // 删除用户
    const deletedUser = await User.delete(userId);
    
    if (!deletedUser) {
      return res.status(500).json({
        success: false,
        error: '删除用户失败'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '用户已成功删除',
      data: { id: deletedUser.id }
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误，请稍后再试'
    });
  }
}; 