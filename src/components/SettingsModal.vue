<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container settings-modal">
      <div class="modal-header">
        <h3>系统设置</h3>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      
      <div class="modal-body">
        <div class="settings-section">
          <h4>天空盒设置</h4>
          <div class="setting-item">
            <label>默认天空盒</label>
            <select v-model="selectedSkybox" @change="handleSkyboxChange" class="setting-select">
              <option value="default">默认天空盒</option>
              <option v-for="skybox in nonDefaultSkyboxes" :key="skybox" :value="skybox">
                {{ skybox }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="settings-section">
          <h4>大气效果</h4>
          <div class="setting-item">
            <label>天空大气层</label>
            <div class="toggle-switch">
              <input 
                type="checkbox" 
                id="atmosphere-toggle" 
                v-model="atmosphereEnabled"
                @change="toggleAtmosphere"
              />
              <label for="atmosphere-toggle"></label>
            </div>
          </div>
        </div>
        
        <div class="settings-section">
          <h4>Cesium控件</h4>
          <div class="setting-item">
            <label>导航帮助按钮</label>
            <div class="toggle-switch">
              <input 
                type="checkbox" 
                id="navigation-help-toggle" 
                v-model="navigationHelpButtonEnabled"
                @change="toggleNavigationHelpButton"
              />
              <label for="navigation-help-toggle"></label>
            </div>
          </div>
          
          <div class="setting-item">
            <label>全屏按钮</label>
            <div class="toggle-switch">
              <input 
                type="checkbox" 
                id="fullscreen-toggle" 
                v-model="fullscreenButtonEnabled"
                @change="toggleFullscreenButton"
              />
              <label for="fullscreen-toggle"></label>
            </div>
          </div>
          
          <div class="setting-item">
            <label>地形影像选择器</label>
            <div class="toggle-switch">
              <input 
                type="checkbox" 
                id="baseLayerPicker-toggle" 
                v-model="baseLayerPickerEnabled"
                @change="toggleBaseLayerPicker"
              />
              <label for="baseLayerPicker-toggle"></label>
            </div>
          </div>
          
          <div class="setting-item">
            <label>位置搜索器</label>
            <div class="toggle-switch">
              <input 
                type="checkbox" 
                id="geocoder-toggle" 
                v-model="geocoderEnabled"
                @change="toggleGeocoder"
              />
              <label for="geocoder-toggle"></label>
            </div>
          </div>
          
          <div class="setting-item">
            <label>首页按钮</label>
            <div class="toggle-switch">
              <input 
                type="checkbox" 
                id="home-button-toggle" 
                v-model="homeButtonEnabled"
                @change="toggleHomeButton"
              />
              <label for="home-button-toggle"></label>
            </div>
          </div>
          
          <div class="setting-item">
            <label>场景模式切换器</label>
            <div class="toggle-switch">
              <input 
                type="checkbox" 
                id="sceneModePicker-toggle" 
                v-model="sceneModePickerEnabled"
                @change="toggleSceneModePicker"
              />
              <label for="sceneModePicker-toggle"></label>
            </div>
          </div>
        </div>
        
        <div class="settings-section">
          <h4>阴影设置</h4>
          <div class="setting-item">
            <label>阴影效果</label>
            <div class="toggle-switch">
              <input 
                type="checkbox" 
                id="shadows-toggle" 
                v-model="shadowsEnabled"
                @change="toggleShadows"
              />
              <label for="shadows-toggle"></label>
            </div>
          </div>
          
          <div class="setting-item">
            <label>地形阴影</label>
            <div class="toggle-switch">
              <input 
                type="checkbox" 
                id="terrain-shadows-toggle" 
                v-model="terrainShadowsEnabled"
                @change="toggleTerrainShadows"
              />
              <label for="terrain-shadows-toggle"></label>
            </div>
          </div>
        </div>
        
        <div class="settings-section">
          <h4>渲染性能</h4>
          <div class="setting-item">
            <label>抗锯齿</label>
            <div class="toggle-switch">
              <input 
                type="checkbox" 
                id="aa-toggle" 
                v-model="antialiasEnabled"
                @change="toggleAntialias"
              />
              <label for="aa-toggle"></label>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button @click="resetToDefaults" class="reset-btn">恢复默认设置</button>
        <button @click="$emit('close')" class="save-btn">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as Cesium from 'cesium';
import { computed, onMounted, ref } from 'vue';
import { skyboxAPI } from '../services/skybox';

// Props
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

// Emits
/**
 * 定义组件事件
 * close - 关闭模态框
 * skybox-change - 天空盒变更
 * viewer-settings-change - Cesium Viewer控件设置变更
 *   - 此事件需要在父组件（通常是App.vue）中处理
 *   - 接收对象格式为: { setting: '设置名', enabled: true/false } 
 *   - 或重置所有: { setting: 'resetAll', values: {...} }
 *   - 父组件需要实现相应的处理逻辑，可能需要重新初始化Viewer
 */
const emit = defineEmits(['close', 'skybox-change', 'viewer-settings-change']);

// 天空盒相关
const selectedSkybox = ref(props.currentSkybox);
const availableSkyboxes = ref(['default']);

// 计算属性筛选非default的天空盒
const nonDefaultSkyboxes = computed(() => {
  return availableSkyboxes.value.filter(skybox => skybox !== 'default');
});

// 控件状态
const atmosphereEnabled = ref(false);
const navigationHelpButtonEnabled = ref(false);
const fullscreenButtonEnabled = ref(false);
const baseLayerPickerEnabled = ref(false);
const geocoderEnabled = ref(false);
const homeButtonEnabled = ref(false);
const sceneModePickerEnabled = ref(false);
const shadowsEnabled = ref(false);
const terrainShadowsEnabled = ref(false);
const antialiasEnabled = ref(true);

// 组件挂载时初始化状态
onMounted(async () => {
  try {
    if (props.viewer) {
      // 初始化设置前，记录当前的emit事件以防止触发自动关闭
      const originalEmit = emit;
      
      // 临时替换emit函数，防止初始化过程中触发关闭事件
      // @ts-ignore - 忽略类型检查
      emit = (event, ...args) => {
        if (event !== 'close') {
          return originalEmit(event, ...args);
        }
      };
      
      initCurrentSettings();
      await loadAvailableSkyboxes();
      
      // 恢复原始emit函数
      // @ts-ignore - 忽略类型检查
      emit = originalEmit;
    }
  } catch (error) {
    console.error('初始化设置模态框失败:', error);
  }
});

// 加载可用天空盒列表
async function loadAvailableSkyboxes() {
  try {
    const skyboxes = await skyboxAPI.getAll();
    if (Array.isArray(skyboxes) && skyboxes.length > 0) {
      // 确保'default'始终在列表中
      if (!skyboxes.includes('default')) {
        skyboxes.unshift('default');
      }
      availableSkyboxes.value = skyboxes;
    }
  } catch (error) {
    console.error('加载天空盒列表失败:', error);
  }
}

// 初始化当前设置
function initCurrentSettings() {
  if (!props.viewer) return;
  
  // 获取当前大气状态
  atmosphereEnabled.value = props.viewer.scene.skyAtmosphere.show;
  
  // 获取各种控件状态 - 直接检查控件对象是否存在，而不是检查显示样式
  navigationHelpButtonEnabled.value = !!props.viewer.navigationHelpButton;
  fullscreenButtonEnabled.value = !!props.viewer.fullscreenButton;
  baseLayerPickerEnabled.value = !!props.viewer.baseLayerPicker;
  geocoderEnabled.value = !!props.viewer.geocoder;
  homeButtonEnabled.value = !!props.viewer.homeButton;
  sceneModePickerEnabled.value = !!props.viewer.sceneModePicker;
  
  // 记录当前控件状态到控制台，便于调试
  console.log('当前控件状态:', {
    navigationHelpButton: navigationHelpButtonEnabled.value,
    fullscreenButton: fullscreenButtonEnabled.value,
    baseLayerPicker: baseLayerPickerEnabled.value,
    geocoder: geocoderEnabled.value,
    homeButton: homeButtonEnabled.value,
    sceneModePicker: sceneModePickerEnabled.value
  });
  
  // 阴影设置
  shadowsEnabled.value = props.viewer.shadows;
  terrainShadowsEnabled.value = props.viewer.terrainShadows !== Cesium.ShadowMode.DISABLED;
  
  // 抗锯齿设置
  antialiasEnabled.value = props.viewer.scene.postProcessStages.fxaa.enabled;
}

// 变更天空盒
function handleSkyboxChange() {
  emit('skybox-change', selectedSkybox.value);
}

// 切换大气效果
function toggleAtmosphere() {
  if (!props.viewer) return;
  
  // 设置大气层
  props.viewer.scene.skyAtmosphere.show = atmosphereEnabled.value;
  
  // 通知父组件设置已更改
  emit('viewer-settings-change', {
    setting: 'atmosphere',
    enabled: atmosphereEnabled.value
  });
}

// 切换控件
function toggleNavigationHelpButton() {
  if (!props.viewer) return;
  
  // 记录选项更改，明确告知目标状态
  console.log(`设置导航帮助按钮: ${navigationHelpButtonEnabled.value}`);
  
  // 向父组件发送重新配置控件的事件
  emit('viewer-settings-change', {
    setting: 'navigationHelpButton',
    enabled: navigationHelpButtonEnabled.value
  });
}

function toggleFullscreenButton() {
  if (!props.viewer) return;
  
  // 记录选项更改，明确告知目标状态
  console.log(`设置全屏按钮: ${fullscreenButtonEnabled.value}`);
  
  // 向父组件发送重新配置控件的事件
  emit('viewer-settings-change', {
    setting: 'fullscreenButton',
    enabled: fullscreenButtonEnabled.value
  });
}

function toggleBaseLayerPicker() {
  if (!props.viewer) return;
  
  // 记录选项更改，明确告知目标状态
  console.log(`设置地形影像选择器: ${baseLayerPickerEnabled.value}`);
  
  // 向父组件发送重新配置控件的事件
  emit('viewer-settings-change', {
    setting: 'baseLayerPicker',
    enabled: baseLayerPickerEnabled.value
  });
}

function toggleGeocoder() {
  if (!props.viewer) return;
  
  // 记录选项更改，明确告知目标状态
  console.log(`设置位置搜索器: ${geocoderEnabled.value}`);
  
  // 向父组件发送重新配置控件的事件
  emit('viewer-settings-change', {
    setting: 'geocoder',
    enabled: geocoderEnabled.value
  });
}

function toggleHomeButton() {
  if (!props.viewer) return;
  
  // 记录选项更改，明确告知目标状态
  console.log(`设置首页按钮: ${homeButtonEnabled.value}`);
  
  // 向父组件发送重新配置控件的事件
  emit('viewer-settings-change', {
    setting: 'homeButton',
    enabled: homeButtonEnabled.value
  });
}

function toggleSceneModePicker() {
  if (!props.viewer) return;
  
  // 记录选项更改，明确告知目标状态
  console.log(`设置场景模式切换器: ${sceneModePickerEnabled.value}`);
  
  // 向父组件发送重新配置控件的事件
  emit('viewer-settings-change', {
    setting: 'sceneModePicker',
    enabled: sceneModePickerEnabled.value
  });
}

// 切换阴影设置
function toggleShadows() {
  if (!props.viewer) return;
  
  // 直接设置阴影属性
  props.viewer.shadows = shadowsEnabled.value;
  
  // 同时通知父组件设置已更改
  emit('viewer-settings-change', {
    setting: 'shadows',
    enabled: shadowsEnabled.value
  });
}

function toggleTerrainShadows() {
  if (!props.viewer) return;
  
  // 设置地形阴影
  props.viewer.terrainShadows = terrainShadowsEnabled.value 
    ? Cesium.ShadowMode.ENABLED 
    : Cesium.ShadowMode.DISABLED;
  
  // 通知父组件设置已更改
  emit('viewer-settings-change', {
    setting: 'terrainShadows',
    enabled: terrainShadowsEnabled.value
  });
}

// 切换抗锯齿
function toggleAntialias() {
  if (!props.viewer) return;
  
  // 设置抗锯齿
  props.viewer.scene.postProcessStages.fxaa.enabled = antialiasEnabled.value;
  
  // 通知父组件设置已更改
  emit('viewer-settings-change', {
    setting: 'antialias',
    enabled: antialiasEnabled.value
  });
}

// 重置为默认设置
function resetToDefaults() {
  selectedSkybox.value = 'default';
  atmosphereEnabled.value = false;
  navigationHelpButtonEnabled.value = false;
  fullscreenButtonEnabled.value = false;
  baseLayerPickerEnabled.value = false;
  geocoderEnabled.value = false;
  homeButtonEnabled.value = false;
  sceneModePickerEnabled.value = false;
  shadowsEnabled.value = false;
  terrainShadowsEnabled.value = false;
  antialiasEnabled.value = true;
  
  // 向父组件发送重置所有设置的事件
  emit('viewer-settings-change', {
    setting: 'resetAll',
    values: {
      skybox: 'default',
      atmosphere: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      shadows: false,
      terrainShadows: false,
      antialias: true
    }
  });
  
  // 应用天空盒设置
  handleSkyboxChange();
  
  // 直接应用可在运行时更改的设置
  toggleAtmosphere();
  toggleShadows();
  toggleTerrainShadows();
  toggleAntialias();
}
</script>

<style scoped>
/* 模态框背景 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: var(--z-modal);
  transition: background-color var(--transition-normal);
}

.modal-container {
  width: 100%;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color var(--transition-fast);
}

.close-btn:hover {
  color: var(--text-primary);
  background: transparent;
}

.modal-body {
  padding: var(--space-4);
  max-height: 70vh;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4);
  border-top: 1px solid var(--border-color);
}

.settings-modal {
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  color: var(--text-color);
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
}

.settings-section {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border-color);
}

.settings-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.settings-section h4 {
  margin: 0 0 15px 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 600;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 10px;
  background-color: var(--component-bg);
  border-radius: 6px;
  transition: background-color 0.2s;
}

.setting-item:hover {
  background-color: var(--bg-hover);
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  font-size: 14px;
  color: var(--text-color);
}

.setting-select {
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: var(--input-bg);
  color: var(--text-color);
  font-size: 14px;
  min-width: 150px;
}

.reset-btn {
  background-color: var(--warning-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.reset-btn:hover {
  background-color: var(--warning-hover-color);
}

.save-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.save-btn:hover {
  background-color: var(--primary-hover-color);
}

/* 开关样式 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch label {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--toggle-bg);
  transition: .4s;
  border-radius: 24px;
}

.toggle-switch label:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

.toggle-switch input:checked + label {
  background-color: var(--primary-color);
}

.toggle-switch input:checked + label:before {
  transform: translateX(24px);
}

/* 适应深色模式 */
:root[class='dark-theme'] .settings-modal {
  background-color: var(--bg-primary);
  color: var(--text-color);
}

:root[class='dark-theme'] .setting-item {
  background-color: var(--component-bg-dark);
}

:root[class='dark-theme'] .setting-item:hover {
  background-color: var(--bg-hover-dark);
}

:root[class='dark-theme'] .setting-select {
  background-color: var(--input-bg-dark);
  color: var(--text-color);
  border-color: var(--border-color-dark);
}

:root[class='dark-theme'] .toggle-switch label {
  background-color: var(--toggle-bg-dark, #444);
}

:root[class='dark-theme'] .toggle-switch label:before {
  background-color: var(--toggle-handle-dark, #eee);
}

:root[class='dark-theme'] .modal-overlay {
  background-color: rgba(0, 0, 0, 0.7);
}
</style> 