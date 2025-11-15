<template>
  <div class="camera-control-panel" :style="cameraControlPosition">
    <div class="control-wrapper">
      <div class="control-buttons">
        <button class="control-btn" title="自动旋转" 
          @click="toggleAutoRotate" 
          :class="{ 'active': isAutoRotating }">
          <span class="btn-icon">🔄</span>
        </button>
        <button class="control-btn" title="坐标拾取"
          @click="$emit('toggle-coordinate-picking')"
          :class="{ 'active': props.isCoordinatePickingEnabled }">
          <span class="btn-icon">📍</span>
        </button>
        <button class="control-btn" title="复位视角" @click="resetCamera">
          <span class="btn-icon">🏠</span>
        </button>
      </div>
      
      <div class="navigation-controls">
        <div class="direction-controls">
          <button class="control-btn up-btn" title="向上" @click="moveCameraUp">
            <span class="btn-icon">⬆️</span>
          </button>
          <div class="middle-controls">
            <button class="control-btn left-btn" title="向左" @click="moveCameraLeft">
              <span class="btn-icon">⬅️</span>
            </button>
            <button class="control-btn center-btn" title="俯视" @click="lookAtCenter">
              <span class="btn-icon">⏺️</span>
            </button>
            <button class="control-btn right-btn" title="向右" @click="moveCameraRight">
              <span class="btn-icon">➡️</span>
            </button>
          </div>
          <button class="control-btn down-btn" title="向下" @click="moveCameraDown">
            <span class="btn-icon">⬇️</span>
          </button>
        </div>
      </div>
      
      <div class="zoom-controls">
        <button class="control-btn zoom-in" title="放大" @click="zoomIn">
          <span class="btn-icon">➕</span>
        </button>
        <button class="control-btn zoom-out" title="缩小" @click="zoomOut">
          <span class="btn-icon">➖</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as Cesium from 'cesium';
import { computed, onUnmounted, ref } from 'vue';

const props = defineProps({
  viewer: {
    type: Object,
    required: true
  },
  isCoordinatePickingEnabled: {
    type: Boolean,
    default: false
  },
  showRightSidebar: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['toggle-coordinate-picking']);

// 自动旋转状态
const isAutoRotating = ref(false);
const rotateInterval = ref(null);
let initialViewPosition = null;
let initialFov = 1.0; // 默认FOV值

// 计算相机控制面板的位置
const cameraControlPosition = computed(() => {
  // 右侧边栏展开时(280px宽)，位置在右侧边栏左侧边缘
  // 右侧边栏收起时(30px宽)，位置靠近屏幕右侧
  return props.showRightSidebar ? 'right: 330px;' : 'right: 40px;';
});

// 初始化
function initialize() {
  saveInitialViewPosition();
}

// 保存初始视图位置
function saveInitialViewPosition() {
  if (props.viewer && props.viewer.camera) {
    initialViewPosition = {
      destination: props.viewer.camera.position.clone(),
      orientation: {
        heading: props.viewer.camera.heading,
        pitch: props.viewer.camera.pitch,
        roll: props.viewer.camera.roll
      }
    };
    initialFov = props.viewer.camera.frustum.fov;
  }
}

// 开始自动旋转
function startAutoRotate() {
  if (rotateInterval.value) return;

  isAutoRotating.value = true;
  let rotateRate = Math.PI / 180.0;
  rotateInterval.value = setInterval(() => {
    props.viewer.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, rotateRate);
  }, 30);
}

// 停止自动旋转
function stopAutoRotate() {
  if (rotateInterval.value) {
    clearInterval(rotateInterval.value);
    rotateInterval.value = null;
    isAutoRotating.value = false;
  }
}

// 切换自动旋转状态
function toggleAutoRotate() {
  isAutoRotating.value ? stopAutoRotate() : startAutoRotate();
}

// 重置相机
function resetCamera() {
  setViewWuhanDefault();
}

// 设置武汉默认视角
function setViewWuhanDefault() {
  props.viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(114.3162, 30.5810, 150000),
    orientation: {
      heading: 0.0,
      pitch: -Cesium.Math.PI_OVER_TWO,
      roll: 0.0
    }
  });
  saveInitialViewPosition();
  initialFov = props.viewer.camera.frustum.fov;
}

// 飞向武汉侧视角
function flyToWuhanSideView() {
  props.viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.3162, 30.5810, 150000),
    orientation: {
      heading: Cesium.Math.toRadians(90),
      pitch: -Cesium.Math.PI_OVER_TWO,
      roll: 0.0
    },
    duration: 3.0
  });
}

// 飞向武汉俯视角
function flyToWuhanTopView() {
  props.viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.3162, 30.5810, 300000),
    orientation: {
      heading: 0.0,
      pitch: -Cesium.Math.PI_OVER_TWO,
      roll: 0.0
    },
    duration: 3.0
  });
}

// 飞向武汉斜视角
function flyToWuhanOblique() {
  props.viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.3162, 30.5810, 150000),
    orientation: {
      heading: Cesium.Math.toRadians(45),
      pitch: -Cesium.Math.toRadians(60),
      roll: 0.0
    },
    duration: 3.0
  });
}

// 飞向武汉45度倾斜视角
function flyToWuhan45Degree() {
  props.viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.3162, 30.5810, 180000),
    orientation: {
      heading: Cesium.Math.toRadians(30),
      pitch: -Cesium.Math.toRadians(45),
      roll: 0.0
    },
    duration: 3.0
  });
}

// 飞向近距离视角
function flyToCloseView() {
  props.viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.3162, 30.5810, 50000),
    orientation: {
      heading: Cesium.Math.toRadians(15),
      pitch: -Cesium.Math.toRadians(30),
      roll: 0.0
    },
    duration: 3.0
  });
}

// 飞向夜景视角（低角度）
function flyToNightView() {
  props.viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.3162, 30.5810, 100000),
    orientation: {
      heading: Cesium.Math.toRadians(60),
      pitch: -Cesium.Math.toRadians(20),
      roll: 0.0
    },
    duration: 3.0
  });
}

// 设置正常视场角
function setFovNormal() {
  props.viewer.camera.frustum.fov = initialFov;
}

// 设置广角视场角
function setFovWide() {
  props.viewer.camera.frustum.fov = 1.5;
}

// 设置超广角视场角
function setFovUltraWide() {
  props.viewer.camera.frustum.fov = 2.0;
}

// 相机导航控制
function moveCameraUp() {
  props.viewer.camera.moveUp(100000);
}

function moveCameraDown() {
  props.viewer.camera.moveDown(100000);
}

function moveCameraLeft() {
  props.viewer.camera.moveLeft(100000);
}

function moveCameraRight() {
  props.viewer.camera.moveRight(100000);
}

function lookAtCenter() {
  flyToWuhanTopView();
}

function zoomIn() {
  props.viewer.camera.zoomIn(100000);
}

function zoomOut() {
  props.viewer.camera.zoomOut(100000);
}

// 在组件销毁时停止自动旋转
onUnmounted(() => {
  stopAutoRotate();
});

// 暴露方法给父组件
defineExpose({
  initialize,
  setViewWuhanDefault,
  flyToWuhanSideView,
  flyToWuhanTopView,
  flyToWuhanOblique,
  flyToWuhan45Degree,
  flyToCloseView,
  flyToNightView,
  setFovNormal,
  setFovWide,
  setFovUltraWide,
  resetCamera
});
</script>

<style scoped>
.camera-control-panel {
  position: absolute;
  bottom: 20px;
  /* right值由计算属性动态设置 */
  z-index: var(--z-fixed);
  transition: right var(--transition-normal);
}

.control-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background-color: var(--bg-primary);
  padding: var(--space-3);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(4px);
  border: 1px solid var(--border-color);
  transition: background-color var(--transition-normal), border-color var(--transition-normal);
}

.control-buttons {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
}

.navigation-controls {
  margin: var(--space-2) 0;
}

.direction-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.middle-controls {
  display: flex;
  gap: var(--space-2);
}

.zoom-controls {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
}

.control-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius-md);
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all var(--transition-fast);
  padding: 0;
}

.control-btn:hover {
  background-color: var(--primary-light);
  color: var(--primary-dark);
  border-color: var(--primary-color);
}

.control-btn.active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-dark);
}

.btn-icon {
  font-size: 1.2rem;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .camera-control-panel {
    bottom: 10px;
    right: 10px;
  }
  
  .control-wrapper {
    padding: var(--space-2);
  }
  
  .control-btn {
    width: 36px;
    height: 36px;
  }
}
</style> 