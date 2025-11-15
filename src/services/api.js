import axios from 'axios';
import { backendConfig } from '../config';
import { authAPI } from './auth';

// 创建axios实例，使用配置文件中的URL
const apiClient = axios.create({
  baseURL: backendConfig.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: backendConfig.timeout
});

// 添加一个测试连接的方法
async function testConnection() {
  try {
    const response = await axios.get(backendConfig.serverUrl);
    console.log('后端服务连接测试成功:', response.data);
    return true;
  } catch (error) {
    console.error('后端服务连接测试失败:', error);
    return false;
  }
}

// 拦截器处理请求和响应
apiClient.interceptors.request.use(
  (config) => {
    // 检查是否有登录用户，如果有则添加JWT令牌
    const user = authAPI.getCurrentUser();
    if (user && user.token) {
      config.headers['Authorization'] = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    // 处理成功响应数据
    return response;
  },
  (error) => {
    // 处理响应错误
    console.error('API请求错误:', error);
    return Promise.reject(error);
  }
);

// 图层API方法
export const layersAPI = {
  // 测试连接
  testConnection,
  
  // 获取所有图层
  getAll: async () => {
    try {
      const response = await apiClient.get('/layers');
      return response.data;
    } catch (error) {
      console.error('获取图层失败', error);
      throw error;
    }
  },
  
  // 获取单个图层
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/layers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`获取图层${id}失败`, error);
      throw error;
    }
  },
  
  // 创建新图层
  create: async (layerData) => {
    try {
      const response = await apiClient.post('/layers', layerData);
      return response.data;
    } catch (error) {
      console.error('创建图层失败', error);
      throw error;
    }
  },
  
  // 更新图层
  update: async (id, layerData) => {
    try {
      const response = await apiClient.put(`/layers/${id}`, layerData);
      return response.data;
    } catch (error) {
      console.error(`更新图层${id}失败`, error);
      throw error;
    }
  },
  
  // 删除图层
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/layers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`删除图层${id}失败`, error);
      throw error;
    }
  }
};

export default {
  layers: layersAPI
}; 