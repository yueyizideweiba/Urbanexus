<template>
  <div>
    <nav class="top-navbar">
      <div class="navbar-left">
        <div class="navbar-brand">
          <span class="brand-icon">🏙️</span>
          <span class="brand-text">Urban<span class="brand-highlight">exus</span></span>
        </div>
      </div>
      
      <div class="navbar-center">
        <div class="search-box">
          <input 
            type="text" 
            placeholder="搜索位置..." 
            v-model="searchKeyword"
            @keyup.enter="searchLocation"
            @focus="showSearchResults = true"
          />
          <button class="search-button" @click="searchLocation">
            <span>🔍</span>
          </button>
        </div>
        
        <!-- 搜索结果下拉面板 -->
        <div class="search-results" v-if="showSearchResults && searchResults.length > 0">
          <div 
            v-for="(result, index) in searchResults" 
            :key="index" 
            class="search-result-item"
            @click="flyToLocation(result)"
          >
            <div class="result-icon">📍</div>
            <div class="result-content">
              <div class="result-name">{{ result.name }}</div>
              <div class="result-address">{{ result.address }}</div>
            </div>
          </div>
        </div>

        <!-- 搜索加载中提示 -->
        <div class="search-loading" v-if="isSearching">
          <span class="loading-spinner"></span>
          <span class="loading-text">正在搜索...</span>
        </div>
        
        <!-- 搜索无结果提示 -->
        <div class="search-no-results" v-if="showSearchResults && searchResults.length === 0 && !isSearching && hasSearched">
          <span class="no-results-icon">🔍</span>
          <span class="no-results-text">未找到相关位置</span>
        </div>
      </div>
      
      <div class="navbar-right">
        <!-- 主题切换按钮 -->
        <div class="nav-item theme-toggle" @click="toggleTheme">
          <span class="item-icon">{{ isDarkTheme ? '🌞' : '🌙' }}</span>
          <span class="item-text">{{ isDarkTheme ? '浅色模式' : '深色模式' }}</span>
        </div>
        <div class="nav-item help-item" @click="showHelpModal = true">
          <span class="item-icon">❓</span>
          <span class="item-text">帮助</span>
        </div>
        <div class="nav-item settings-item" @click="showSettingsModal = true">
          <span class="item-icon">⚙️</span>
          <span class="item-text">设置</span>
        </div>
        <div class="user-profile" v-if="isLoggedIn">
          <div class="avatar">{{ user ? user.username.charAt(0).toUpperCase() : '' }}</div>
          <span class="username">{{ user ? user.username : '' }}</span>
          <div class="dropdown-menu">
            <div class="dropdown-item" v-if="isAdmin" @click="showUserManagement">用户管理</div>
            <div class="dropdown-item" @click="logout">退出登录</div>
          </div>
        </div>
        <div class="login-button" v-else @click="showAuthModal = true">
          <span>登录 / 注册</span>
        </div>
      </div>
    </nav>

    <!-- 认证模态框 -->
    <Auth 
      v-if="showAuthModal" 
      @close="showAuthModal = false"
      @login-success="handleLoginSuccess"
    />
    
    <!-- 用户管理模态框 -->
    <div class="modal-overlay" v-if="showUserManagementModal" @click.self="closeUserManagementModal">
      <div class="modal-container user-management-modal">
        <div class="modal-header">
          <h3>用户管理</h3>
          <button class="close-btn" @click="closeUserManagementModal">&times;</button>
        </div>
        <div class="modal-body user-management-body">
          <UserManagement />
        </div>
      </div>
    </div>

    <!-- 帮助模态框 -->
    <div class="modal-overlay" v-if="showHelpModal" @click.self="showHelpModal = false">
      <Help @close="showHelpModal = false" />
    </div>
    
    <!-- 设置模态框 -->
    <SettingsModal 
      v-if="showSettingsModal" 
      :viewer="viewer"
      :currentSkybox="currentSkybox"
      @close="showSettingsModal = false"
      @skybox-change="handleSettingsSkyboxChange"
      @viewer-settings-change="handleViewerSettingsChange"
    />
  </div>
</template>

<script setup>
import axios from 'axios';
import * as coordtransform from 'coordtransform';
import { computed, onMounted, ref } from 'vue';
import { authAPI } from '../services/auth';
import Auth from './Auth.vue';
import Help from './Help.vue';
import SettingsModal from './SettingsModal.vue';
import UserManagement from './UserManagement.vue';

const props = defineProps({
  viewer: {
    type: Object,
    required: true
  },
  currentSkybox: {
    type: String,
    default: 'default'
  }
});

const emit = defineEmits([
  'geometry-show-tools',
  'geometry-measure-distance', 
  'geometry-measure-area',
  'scene-analysis',
  'buffer-analysis-open',
  'geojson-styler-open',
  'extruder-open',
  'camera-set-view',
  'camera-set-fov',
  'camera-reset',
  'terrain-switch',
  'data-loader-trigger',
  'data-loader-load-http-tiles',
  'layer-manager-open',
  'fly-to-location',
  'user-login-success',
  'user-logout',
  'theme-change',
  'skybox-change',
  'character-explorer-toggle',
  'viewer-settings-change'
]);

// 主题切换相关
const isDarkTheme = ref(false);
const THEME_KEY = 'cesium-theme-preference';

// 搜索相关状态
const searchKeyword = ref('');
const searchResults = ref([]);
const showSearchResults = ref(false);
const isSearching = ref(false);
const hasSearched = ref(false);

// 高德API密钥
const aMapKey = '835e9f0656ea757f449995c40c9b9b6f';

// 在组件挂载时检查是否有保存的主题偏好
onMounted(() => {
  // 检查本地存储中的主题偏好
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === 'dark') {
    applyDarkTheme();
  }
  
  // 检查系统主题偏好
  if (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyDarkTheme();
  }

  checkLoginStatus();
});

// 切换主题
function toggleTheme() {
  if (isDarkTheme.value) {
    applyLightTheme();
  } else {
    applyDarkTheme();
  }
}

// 应用深色主题
function applyDarkTheme() {
  document.documentElement.classList.add('dark-theme');
  isDarkTheme.value = true;
  localStorage.setItem(THEME_KEY, 'dark');
  emit('theme-change', true);
}

// 应用浅色主题
function applyLightTheme() {
  document.documentElement.classList.remove('dark-theme');
  isDarkTheme.value = false;
  localStorage.setItem(THEME_KEY, 'light');
  emit('theme-change', false);
}

// 搜索位置
async function searchLocation() {
  if (!searchKeyword.value.trim()) return;
  
  isSearching.value = true;
  showSearchResults.value = true;
  hasSearched.value = true;
  searchResults.value = [];
  
  try {
    const response = await axios.get(`https://restapi.amap.com/v3/place/text`, {
      params: {
        keywords: searchKeyword.value,
        key: aMapKey,
        extensions: 'base',
        output: 'json'
      }
    });
    
    if (response.data.status === '1' && response.data.pois && response.data.pois.length > 0) {
      // 最多显示5个结果
      searchResults.value = response.data.pois.slice(0, 5).map(poi => ({
        id: poi.id,
        name: poi.name,
        address: poi.address || poi.pname + poi.cityname + poi.adname,
        location: poi.location,
        province: poi.pname,
        city: poi.cityname,
        district: poi.adname
      }));
    }
  } catch (error) {
    console.error('搜索位置失败:', error);
  } finally {
    isSearching.value = false;
  }
}

// 点击结果项飞行到该位置
function flyToLocation(result) {
  if (!result || !result.location) return;
  
  // 解析坐标
  const location = result.location.split(',');
  const lng = parseFloat(location[0]);
  const lat = parseFloat(location[1]);
  
  // 高德坐标(GCJ-02)转WGS84
  const wgs84 = coordtransform.gcj02towgs84(lng, lat);
  
  // 发送事件给父组件
  emit('fly-to-location', {
    longitude: wgs84[0],
    latitude: wgs84[1],
    name: result.name,
    address: result.address
  });
  
  // 关闭搜索结果面板
  searchResults.value = [];
  showSearchResults.value = false;
}

// 点击外部区域关闭搜索结果面板
window.addEventListener('click', (e) => {
  const searchBox = document.querySelector('.search-box');
  const searchResults = document.querySelector('.search-results');
  
  if (searchBox && !searchBox.contains(e.target) && 
      searchResults && !searchResults.contains(e.target)) {
    showSearchResults.value = false;
  }
});

// 用户认证相关
const showAuthModal = ref(false);
const user = ref(null);
const isLoggedIn = computed(() => !!user.value);
const isAdmin = computed(() => user.value && user.value.role === 'admin');

// 用户管理模态框
const showUserManagementModal = ref(false);

// 显示用户管理模态框
function showUserManagement() {
  showUserManagementModal.value = true;
}

// 关闭用户管理模态框
function closeUserManagementModal() {
  showUserManagementModal.value = false;
}

// 检查用户登录状态
function checkLoginStatus() {
  const currentUser = authAPI.getCurrentUser();
  if (currentUser) {
    user.value = currentUser;
  }
}

// 处理登录成功
function handleLoginSuccess(userData) {
  user.value = userData;
  showAuthModal.value = false;
  
  // 触发登录成功事件给App.vue
  emit('user-login-success', userData);
}

// 登出
function logout() {
  authAPI.logout();
  user.value = null;
  
  // 触发登出事件给App.vue
  emit('user-logout');
}

// 帮助模态框状态
const showHelpModal = ref(false);

// 模态框显示状态
const showSettingsModal = ref(false);

// 处理设置中的天空盒变更
function handleSettingsSkyboxChange(skyboxName) {
  emit('skybox-change', skyboxName);
}

// 处理设置模态框中的Viewer控件设置变更
function handleViewerSettingsChange(settings) {
  // 将设置变更事件传递给父组件，由App.vue处理
  emit('viewer-settings-change', settings);
  
  // 根据设置的不同，可能需要直接在这里处理一些简单的设置
  if (settings.setting === 'atmosphere') {
    // 大气层设置可以直接在这里处理
    if (props.viewer) {
      props.viewer.scene.skyAtmosphere.show = settings.enabled;
    }
  }
  
  // 复杂的控件设置需要在App.vue中通过重新初始化Viewer来实现
}
</script>

<style scoped>
.top-navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--bg-primary);
  padding: 0 var(--space-4);
  box-shadow: var(--shadow-md);
  height: 60px;
  box-sizing: border-box;
  margin: 0;
  width: 100%;
  border-bottom: 1px solid var(--border-color);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  transition: background-color var(--transition-normal), border-color var(--transition-normal);
}

.navbar-left, .navbar-right, .navbar-center {
  display: flex;
  align-items: center;
}

.navbar-brand {
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 12px;
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform-style: preserve-3d;
  perspective: 1000px;
}

.navbar-brand:hover {
  transform: translateY(-2px) rotateX(5deg);
  box-shadow: 
    0 8px 12px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.navbar-brand::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 12px;
  background: linear-gradient(
    45deg,
    rgba(var(--primary-rgb), 0.2) 0%,
    rgba(var(--primary-rgb), 0) 100%
  );
  z-index: -1;
  transition: opacity 0.3s ease;
  opacity: 0;
}

.navbar-brand:hover::before {
  opacity: 1;
}

.brand-icon {
  margin-right: var(--space-2);
  font-size: 1.8rem;
  transform-style: preserve-3d;
  animation: float 3s ease-in-out infinite;
}

.brand-text {
  letter-spacing: 1px;
  position: relative;
  font-weight: 700;
  background: linear-gradient(
    120deg,
    var(--text-primary) 0%,
    var(--text-primary) 45%,
    var(--primary-color) 55%,
    var(--primary-color) 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.2));
}

.brand-highlight {
  font-weight: 900;
  position: relative;
  background: linear-gradient(
    135deg,
    var(--primary-color) 0%,
    #9c5ae7 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.2));
  text-shadow: none;
}

/* 添加文字描边效果增加可见度 */
.brand-text, .brand-highlight {
  -webkit-text-stroke: 0.3px var(--text-primary);
}

.brand-highlight::before {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--primary-color) 20%,
    #9c5ae7 50%,
    var(--primary-color) 80%,
    transparent 100%
  );
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 1;
  box-shadow: 
    0 0 10px var(--primary-color),
    0 0 20px rgba(156, 90, 231, 0.5);
  filter: brightness(1.2);
}

.navbar-brand:hover .brand-highlight::before {
  transform: scaleX(1);
}

/* 添加下划线的辉光动画 */
@keyframes glow {
  0%, 100% {
    filter: brightness(1) blur(0.5px);
    box-shadow: 
      0 0 10px var(--primary-color),
      0 0 20px rgba(156, 90, 231, 0.5);
  }
  50% {
    filter: brightness(1.5) blur(1px);
    box-shadow: 
      0 0 15px var(--primary-color),
      0 0 30px rgba(156, 90, 231, 0.7);
  }
}

.navbar-brand:hover .brand-highlight::before {
  transform: scaleX(1);
  animation: glow 2s infinite ease-in-out;
}

/* 添加文字发光效果 */
.brand-highlight::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  background: var(--primary-color);
  filter: blur(12px);
  opacity: 0;
  z-index: -1;
  transition: opacity 0.3s ease;
}

.navbar-brand:hover::after {
  opacity: 0.2;
}

/* 确保渐变和发光效果在深色模式下也清晰可见 */
:root[class='dark-theme'] .brand-text,
:root[class='dark-theme'] .brand-highlight {
  filter: drop-shadow(0 2px 4px rgba(255, 255, 255, 0.1));
  -webkit-text-stroke: 0.3px rgba(255, 255, 255, 0.7);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0);
  }
  50% {
    transform: translateY(-5px) rotate(5deg);
  }
}

/* 添加光晕效果 */
.navbar-brand::after {
  content: '';
  position: absolute;
  top: -20%;
  left: -20%;
  right: -20%;
  bottom: -20%;
  background: radial-gradient(
    circle at center,
    rgba(var(--primary-rgb), 0.1) 0%,
    transparent 70%
  );
  z-index: -2;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.navbar-brand:hover::after {
  opacity: 1;
}

/* 添加闪光效果 */
@keyframes shine {
  0% {
    transform: translateX(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) rotate(45deg);
  }
}

.navbar-brand::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 50px;
  height: 100%;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 100%
  );
  transform: translateX(-100%) rotate(45deg);
  animation: shine 3s infinite;
  z-index: 1;
}

.navbar-center {
  flex: 1;
  justify-content: center;
  margin: 0 var(--space-6);
  position: relative;
}

.search-box {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 400px;
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-full);
  padding: var(--space-1);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.search-box:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-light);
}

.search-box input {
  flex: 1;
  border: none;
  background: transparent;
  padding: var(--space-2) var(--space-3);
  font-size: 0.875rem;
  color: var(--text-primary);
}

.search-box input:focus {
  outline: none;
  box-shadow: none;
}

.search-button {
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius-full);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.search-button:hover {
  background-color: var(--primary-dark);
}

.search-results {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 400px;
  margin-top: var(--space-1);
  background-color: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-dropdown);
  overflow: hidden;
  max-height: 350px;
  overflow-y: auto;
  animation: fadeIn var(--transition-normal) ease-in-out;
  border: 1px solid var(--border-color);
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: var(--space-3);
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.search-result-item:hover {
  background-color: var(--bg-secondary);
}

.search-result-item:last-child {
  border-bottom: none;
}

.result-icon {
  margin-right: var(--space-2);
  color: var(--primary-color);
  font-size: 1.2rem;
}

.result-content {
  flex: 1;
}

.result-name {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.result-address {
  font-size: 0.75rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-loading, .search-no-results {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 400px;
  margin-top: var(--space-1);
  background-color: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  z-index: var(--z-dropdown);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  animation: fadeIn var(--transition-normal) ease-in-out;
}

.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  margin-right: var(--space-2);
  animation: spin 1s linear infinite;
}

.loading-text, .no-results-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.no-results-icon {
  font-size: 1.2rem;
  margin-right: var(--space-2);
  color: var(--text-secondary);
}

.theme-toggle {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-right: var(--space-4);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--border-radius-md);
  transition: background-color var(--transition-fast);
}

.theme-toggle:hover {
  background-color: var(--bg-secondary);
}

.nav-item {
  position: relative;
  padding: var(--space-2) var(--space-3);
  margin-left: var(--space-3);
  cursor: pointer;
  color: var(--text-primary);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
}

.nav-item:hover {
  background-color: var(--bg-hover);
}

.reality-city-item {
  position: relative;
}

.reality-city-item .dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 180px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  z-index: 1001;
  box-shadow: var(--shadow-md);
  margin-top: var(--space-1);
}

.reality-city-item .dropdown-item {
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.reality-city-item .dropdown-item:hover {
  background-color: var(--primary-light);
  color: var(--primary-dark);
}

.item-icon {
  margin-right: var(--space-2);
}

.item-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.user-profile {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  z-index: 1001;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 150px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1002;
  display: none;
}

.user-profile:hover .dropdown-menu {
  display: block;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  margin-right: var(--space-2);
}

.username {
  font-weight: 500;
  color: var(--text-primary);
}

.dropdown-item {
  padding: 10px 15px;
  font-size: 14px;
  cursor: pointer;
  color: var(--text-primary);
}

.dropdown-item:hover {
  background-color: var(--neutral-100);
}

.login-button {
  padding: 6px 12px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  margin-left: var(--space-2);
}

.login-button:hover {
  background-color: var(--primary-dark);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 下拉菜单样式 */
.dropdown {
  position: relative;
}

.dropdown-toggle {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.dropdown-content {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 160px;
  z-index: 1000;
  margin-top: 4px;
  overflow: hidden;
  animation: fadeIn 0.2s ease-out;
}

.dropdown-item {
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-primary);
  font-size: 14px;
}

.dropdown-item:hover {
  background-color: var(--bg-hover);
  color: var(--primary-color);
}

.dropdown-item:not(:last-child) {
  border-bottom: 1px solid var(--border-color);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 用户管理模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.user-management-modal {
  width: 80%;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
}

.user-management-body {
  padding: 0;
  overflow-y: auto;
  flex: 1;
}
</style> 