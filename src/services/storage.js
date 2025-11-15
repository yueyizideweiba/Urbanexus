import axios from 'axios';
import { authAPI } from './auth';

const API_BASE_URL = 'http://114.215.206.64:3000/api/storage';

// 创建带有认证头的 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL
});

// 添加请求拦截器
api.interceptors.request.use(
  config => {
    const token = authAPI.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export const storageAPI = {
  // 获取用户文件列表
  async getUserFiles() {
    try {
      const response = await api.get('/user/current');
      return response.data;
    } catch (error) {
      console.error('获取文件列表失败:', error);
      throw error;
    }
  },
  
  // 获取文件信息以加载到图层
  async getFileForLayer(fileId) {
    try {
      const response = await api.get(`/file/${fileId}`);
      return response.data;
    } catch (error) {
      console.error('获取文件信息失败:', error);
      throw error;
    }
  },
  
  // 上传文件
  async uploadFile(formData) {
    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('上传文件失败:', error);
      throw error;
    }
  },
  
  // 更新文件信息
  async updateFile(fileId, data) {
    try {
      const response = await api.put(`/${fileId}`, data);
      return response.data;
    } catch (error) {
      console.error('更新文件失败:', error);
      throw error;
    }
  },
  
  // 删除文件
  async deleteFile(fileId) {
    try {
      const response = await api.delete(`/${fileId}`);
      return response.data;
    } catch (error) {
      console.error('删除文件失败:', error);
      throw error;
    }
  }
}; 