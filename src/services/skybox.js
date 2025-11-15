import axios from 'axios';

// 获取服务器环境变量或默认为服务器IP
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://114.215.206.64:3000';

export const skyboxAPI = {
  /**
   * 获取所有可用的天空盒列表
   * @returns {Promise<Array<string>>} 天空盒文件夹名称数组
   */
  async getAll() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/skyboxes`);
      return response.data;
    } catch (error) {
      console.error('获取天空盒列表失败:', error);
      // 如果后端API不可用，返回默认天空盒
      return ['default', 'bluesky', 'sunset', 'overcast'];
    }
  }
}; 