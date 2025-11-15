import axios from 'axios';

const API_BASE_URL = 'http://114.215.206.64:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 测试连接
const testConnection = async () => {
  try {
    const response = await apiClient.get('/layers');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 获取所有图层
const getAll = async () => {
  try {
    const response = await apiClient.get('/layers');
    return response.data;
  } catch (error) {
    console.error('获取图层失败', error);
    throw error;
  }
};

// 获取单个图层
const getById = async (id) => {
  try {
    const response = await apiClient.get(`/layers/${id}`);
    return response.data;
  } catch (error) {
    console.error(`获取图层${id}失败`, error);
    throw error;
  }
};

// 创建新图层
const create = async (layerData) => {
  try {
    const response = await apiClient.post('/layers', layerData);
    return response.data;
  } catch (error) {
    console.error('创建图层失败', error);
    throw error;
  }
};

// 更新图层
const update = async (id, layerData) => {
  try {
    const response = await apiClient.put(`/layers/${id}`, layerData);
    return response.data;
  } catch (error) {
    console.error(`更新图层${id}失败`, error);
    throw error;
  }
};

// 删除图层
const remove = async (id) => {
  try {
    const response = await apiClient.delete(`/layers/${id}`);
    return response.data;
  } catch (error) {
    console.error(`删除图层${id}失败`, error);
    throw error;
  }
};

export const layersAPI = {
  testConnection,
  getAll,
  getById,
  create,
  update,
  delete: remove
}; 