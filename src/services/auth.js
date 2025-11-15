import axios from 'axios';
import { backendConfig } from '../config';

// 创建axios实例
const authClient = axios.create({
  baseURL: backendConfig.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: backendConfig.timeout
});

// 添加请求拦截器
authClient.interceptors.request.use(
  (config) => {
    console.log('发送请求:', {
      url: config.url,
      method: config.method,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 添加响应拦截器
authClient.interceptors.response.use(
  (response) => {
    console.log('收到响应:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('响应错误:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// 存储用户会话信息的key
const USER_KEY = 'cesium_user';

// 处理响应数据
const handleResponse = (response) => {
  const { data } = response;
  if (data.success) {
    return {
      success: true,
      data: data.data,
      message: data.message
    };
  }
  return {
    success: false,
    error: data.error,
    errors: data.errors
  };
};

// 处理错误
const handleError = (error) => {
  if (error.response) {
    // 服务器返回错误响应
    const { data } = error.response;
    return {
      success: false,
      error: data.error || '请求失败',
      errors: data.errors
    };
  }
  if (error.request) {
    // 请求发送失败
    return {
      success: false,
      error: '无法连接到服务器，请检查网络连接'
    };
  }
  // 其他错误
  return {
    success: false,
    error: '发生未知错误，请稍后重试'
  };
};

// 认证服务
export const authAPI = {
  // 获取当前登录用户
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      if (userStr) {
        const userData = JSON.parse(userStr);
        // 检查token是否过期
        if (userData.token) {
          const payload = JSON.parse(atob(userData.token.split('.')[1]));
          if (payload.exp * 1000 > Date.now()) {
            return userData;
          }
        }
        // token过期，清除用户数据
        localStorage.removeItem(USER_KEY);
      }
      return null;
    } catch (error) {
      console.error('获取用户信息失败', error);
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  // 获取认证令牌
  getToken: () => {
    const user = authAPI.getCurrentUser();
    return user?.token;
  },

  // 设置认证头
  setAuthHeader: (config) => {
    const token = authAPI.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },

  // 登录
  login: async (username, password) => {
    try {
      console.log('尝试登录:', { username });
      const response = await authClient.post('/auth/login', {
        username,
        password
      });
      
      const result = handleResponse(response);
      console.log('登录结果:', result);
      
      if (result.success && result.data?.user && result.data?.token) {
        // 存储用户信息到本地
        const userData = {
          ...result.data.user,
          token: result.data.token
        };
        console.log('存储用户数据:', { ...userData, token: '***' });
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
      }
      
      return result;
    } catch (error) {
      console.error('登录失败:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return handleError(error);
    }
  },

  // 注册
  register: async (userData) => {
    try {
      console.log('尝试注册:', { ...userData, password: '***' });
      const response = await authClient.post('/auth/register', userData);
      const result = handleResponse(response);
      console.log('注册结果:', result);
      return result;
    } catch (error) {
      console.error('注册失败:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return handleError(error);
    }
  },

  // 登出
  logout: () => {
    localStorage.removeItem(USER_KEY);
    return { success: true, message: '已成功登出' };
  },

  // 检查是否已登录
  isLoggedIn: () => {
    return authAPI.getCurrentUser() !== null;
  },
  
  // 检查是否是管理员
  isAdmin: () => {
    const user = authAPI.getCurrentUser();
    return user?.role === 'admin';
  },
  
  // 获取所有用户
  getAllUsers: async () => {
    try {
      const config = { headers: {} };
      authAPI.setAuthHeader(config);
      const response = await authClient.get('/users', config);
      return handleResponse(response);
    } catch (error) {
      console.error('获取用户列表失败', error);
      return handleError(error);
    }
  },
  
  // 获取单个用户
  getUserById: async (userId) => {
    try {
      const config = { headers: {} };
      authAPI.setAuthHeader(config);
      const response = await authClient.get(`/users/${userId}`, config);
      return handleResponse(response);
    } catch (error) {
      console.error('获取用户信息失败', error);
      return handleError(error);
    }
  },
  
  // 更新用户
  updateUser: async (userId, userData) => {
    try {
      const config = { headers: {} };
      authAPI.setAuthHeader(config);
      const response = await authClient.put(`/users/${userId}`, userData, config);
      return handleResponse(response);
    } catch (error) {
      console.error('更新用户失败', error);
      return handleError(error);
    }
  },
  
  // 删除用户
  deleteUser: async (userId) => {
    try {
      const config = { headers: {} };
      authAPI.setAuthHeader(config);
      const response = await authClient.delete(`/users/${userId}`, config);
      return handleResponse(response);
    } catch (error) {
      console.error('删除用户失败', error);
      return handleError(error);
    }
  }
};

export default {
  auth: authAPI
}; 