/**
 * 应用程序配置
 */

// 后端服务配置
export const backendConfig = {
  // 后端API基础URL
  apiBaseUrl: 'http://114.215.206.64:3000/api',
  
  // 后端服务URL (不包含api路径)
  serverUrl: 'http://114.215.206.64:3000',
  
  // API请求超时时间(毫秒)
  timeout: 10000
};

// 全局配置
export const appConfig = {
  // 应用名称
  appName: '地理空间信息应用',
  
  // 默认视图设置
  defaultView: {
    longitude: 114.3162,
    latitude: 30.5810,
    height: 150000
  }
};

export default {
  backend: backendConfig,
  app: appConfig
}; 