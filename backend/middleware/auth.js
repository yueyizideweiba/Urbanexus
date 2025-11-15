const jwt = require('jsonwebtoken');

// 验证JWT令牌的中间件
exports.verifyToken = (req, res, next) => {
  // 获取Authorization头信息
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '无访问权限，请先登录'
    });
  }
  
  // 提取令牌
  const token = authHeader.split(' ')[1];
  
  try {
    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 将用户信息添加到请求对象
    req.user = decoded;
    
    // 继续下一步
    next();
  } catch (error) {
    console.error('令牌验证失败:', error);
    return res.status(401).json({
      success: false,
      error: '登录已过期，请重新登录'
    });
  }
};

// 验证管理员权限的中间件
exports.requireAdmin = (req, res, next) => {
  // 先验证令牌
  exports.verifyToken(req, res, () => {
    // 检查用户角色
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({
        success: false,
        error: '权限不足，需要管理员权限'
      });
    }
  });
}; 